from time import time

import collections
import numpy as np
import re
from PIL import Image, ImageDraw
from os import sched_getaffinity, sched_setaffinity
from pathlib import Path
from worker.assets import tflite_models
from worker.management.commands.constants import (
    DETECT_TFLITE,
    DETECT_YOLO,
    TFLITE_LABELS,
    TFLITE_MODEL,
    YOLO_MODEL,
)

Object = collections.namedtuple("Object", ["id", "score", "bbox"])


class BBox(collections.namedtuple("BBox", ["xmin", "ymin", "xmax", "ymax"])):
    def scale(self, sx, sy):
        return BBox(
            xmin=sx * self.xmin,
            ymin=sy * self.ymin,
            xmax=sx * self.xmax,
            ymax=sy * self.ymax,
        )

    def map(self, f):
        return BBox(
            xmin=f(self.xmin), ymin=f(self.ymin), xmax=f(self.xmax), ymax=f(self.ymax)
        )


def input_size(model):
    _, height, width, _ = model.get_input_details()[0]["shape"]
    return width, height


def output_tensor(model, i):
    tensor = model.get_tensor(model.get_output_details()[i]["index"])
    return np.squeeze(tensor)


def get_output(model, score_threshold):
    boxes = output_tensor(model, 0)
    class_ids = output_tensor(model, 1)
    scores = output_tensor(model, 2)
    count = int(output_tensor(model, 3))

    decode_width, decode_height = input_size(model)

    def make(i):
        ymin, xmin, ymax, xmax = boxes[i]
        return Object(
            id=int(class_ids[i]),
            score=float(scores[i]),
            bbox=BBox(xmin=xmin, ymin=ymin, xmax=xmax, ymax=ymax)
            .scale(decode_width, decode_height)
            .map(int),
        )

    return [make(i) for i in range(count) if scores[i] >= score_threshold]


def draw_objs(frame, objs, labels):
    img = Image.fromarray(frame)
    draw = ImageDraw.Draw(img)
    for obj in objs:
        draw.rectangle(
            [(obj.bbox.xmin, obj.bbox.ymin), (obj.bbox.xmax, obj.bbox.ymax)],
            outline="red",
        )
        draw.text(
            (obj.bbox.xmin + 10, obj.bbox.ymin + 10),
            "%s\n%.2f" % (labels.get(obj.id, obj.id), obj.score),
            fill="red",
        )
    return np.asarray(img)


def load_model(camera_id, decode_size):
    model = None

    if DETECT_TFLITE:
        import tflite_runtime.interpreter as tflite

        print(
            f"{camera_id}: Loading '{TFLITE_MODEL}'...",
            flush=True,
        )
        model = tflite.Interpreter(
            model_path=str(Path(tflite_models.__file__).parent / TFLITE_MODEL),
            experimental_delegates=[tflite.load_delegate("libedgetpu.so.1")],
        )
        model.allocate_tensors()
        decode_size = input_size(model)
        print(f"{camera_id}: Loaded TensorFlow Lite model.")

    elif DETECT_YOLO:
        from ultralytics import YOLO

        decode_width, decode_height = decode_size

        print(f"{camera_id}: Loading '{YOLO_MODEL}'...", flush=True)
        model = YOLO(YOLO_MODEL)
        frame = np.zeros([decode_height, decode_width, 3])
        model.track(frame, half=True, verbose=False)
        print(f"{camera_id}: Loaded YOLOv8 model.")

        print(f"{camera_id}: Setting CPU affinity...", flush=True)
        cpus = list(sched_getaffinity(0))
        affinity = {cpus[camera_id % len(cpus)]}
        sched_setaffinity(0, affinity)
        print(f"{camera_id}: Set affinity to {affinity}.")

    return model, decode_size


def load_labels(camera_id):
    labels = None

    if DETECT_TFLITE:
        print(
            f"{camera_id}: Loading '{TFLITE_LABELS}'...",
            flush=True,
        )
        labels_path = Path(tflite_models.__file__).parent / TFLITE_LABELS
        p = re.compile(r"\s*(\d+)(.+)")
        with labels_path.open() as f:
            lines = (p.match(line).groups() for line in f.readlines())
            labels = {int(num): text.strip() for num, text in lines}
        print(f"{camera_id}: Loaded TensorFlow Lite labels.")

    return labels


def run_pipeline(camera_id, decode_size, feature_config, ff_processes, model, labels):
    decode_width, decode_height = decode_size
    detect_enabled, drawbox_enabled, drawtext_enabled = feature_config

    print()
    print(f"{camera_id}: Starting overlay loop...", flush=True)

    frame_size = decode_width * decode_height * 3
    frame_buffer = bytearray(frame_size)

    counter = 0
    frame_rate = 0
    start = time()

    while all(ff_process.poll() is None for ff_process in ff_processes):
        frame_pos = 0
        while frame_pos < frame_size:
            frame_view = memoryview(frame_buffer)[frame_pos:]
            in_bytes = ff_processes[0].stdout.readinto(frame_view)
            if not in_bytes:
                ff_processes[0].terminate()
                break
            frame_pos += in_bytes

        if frame_pos != frame_size:
            continue

        frame = np.frombuffer(frame_buffer, np.uint8)
        frame = frame.reshape([decode_height, decode_width, 3])

        if detect_enabled:
            if DETECT_TFLITE:
                input_details = model.get_input_details()
                floating_model = input_details[0]["dtype"] == np.float32

                input_data = np.expand_dims(frame, axis=0)
                if floating_model:
                    input_data = (np.float32(input_data) - 127.5) / 127.5

                model.set_tensor(input_details[0]["index"], input_data)
                model.invoke()

                results = get_output(model, 0.25)

            elif DETECT_YOLO:
                results = model.track(frame, half=True, verbose=False)

            if drawbox_enabled:
                if DETECT_TFLITE:
                    frame = draw_objs(frame, results, labels)
                elif DETECT_YOLO:
                    frame = results[0].plot()

                ff_processes[1].stdin.write(frame.tobytes())

        counter += 1
        if counter >= int(frame_rate) * 10:
            end = time()
            frame_rate = counter / (end - start)
            print(f"{camera_id}: {frame_rate} fps")
            counter = 0
            start = end
