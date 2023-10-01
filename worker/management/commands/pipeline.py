from time import time

import numpy as np
from os import sched_getaffinity, sched_setaffinity
from worker.management.commands.constants import YOLO_MODEL


def load_model(camera_id, decode_size):
    from ultralytics import YOLO

    decode_width, decode_height = decode_size

    print(f"{camera_id}: Loading YOLOv8 model...", flush=True)
    model = YOLO(YOLO_MODEL)
    frame = np.zeros([decode_height, decode_width, 3])
    model.track(frame, half=True, verbose=False)
    print(f"{camera_id}: Loaded {YOLO_MODEL}.")

    print(f"{camera_id}: Setting CPU affinity...", flush=True)
    cpus = list(sched_getaffinity(0))
    affinity = {cpus[camera_id % len(cpus)]}
    sched_setaffinity(0, affinity)
    print(f"{camera_id}: Set affinity to {affinity}.")


def run_pipeline(camera_id, decode_size, feature_config, ff_processes, model):
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
            results = model.track(frame, half=True, verbose=False)

            if drawbox_enabled:
                frame = results[0].plot()
                ff_processes[1].stdin.write(frame.tobytes())

        counter += 1
        if counter >= int(frame_rate) * 10:
            end = time()
            frame_rate = counter / (end - start)
            print(f"{camera_id}: {frame_rate} fps")
            counter = 0
            start = end
