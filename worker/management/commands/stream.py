import sys
import time

from datetime import timedelta
from multiprocessing import Process
from os import kill, mkfifo, makedirs, sched_getaffinity, sched_setaffinity
from os.path import join
from shutil import rmtree
from signal import SIGINT
from tempfile import mkdtemp

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

import ffmpeg
import numpy as np

from camera.models import Camera
from storage.models import Video


def get_detection_settings(camera):
    ds = {}

    try:
        ds["md_enabled"] = camera.motiondetectionsettings.enabled
        ds["md_visualize"] = camera.motiondetectionsettings.visualize
    except ObjectDoesNotExist:
        ds["md_enabled"] = False
        ds["md_visualize"] = False

    try:
        ds["od_enabled"] = camera.objectdetectionsettings.enabled
        ds["od_visualize"] = camera.objectdetectionsettings.visualize
    except ObjectDoesNotExist:
        ds["od_enabled"] = False
        ds["od_visualize"] = False

    try:
        ds["fd_enabled"] = camera.facedetectionsettings.enabled
        ds["fd_visualize"] = camera.facedetectionsettings.visualize
    except ObjectDoesNotExist:
        ds["fd_enabled"] = False
        ds["fd_visualize"] = False

    try:
        ds["ld_enabled"] = camera.alprsettings.enabled
        ds["ld_visualize"] = camera.alprsettings.visualize
    except ObjectDoesNotExist:
        ds["ld_enabled"] = False
        ds["ld_visualize"] = False

    return ds


def mkfifotemp(extension):
    path = join(mkdtemp(), f"tmp.{extension}")
    mkfifo(path)
    return path


def handle_stream(camera_id):
    try:
        camera = Camera.objects.get(pk=camera_id)
    except Camera.DoesNotExist:
        raise CommandError(f"Camera {camera_id} does not exist")

    if not camera.enabled:
        print(f"'{camera.name}' is disabled.")
        return

    stream_url = camera.urls()[0]

    print(f"{camera_id}: Probing camera...", flush=True)
    try:
        probe = ffmpeg.probe(
            stream_url,
            stimeout=5000000,
            hide_banner=None,
            loglevel="error",
        )
    except ffmpeg.Error as e:
        print(e.stderr.decode(), file=sys.stderr)
        raise CommandError(f"Could not probe camera {camera_id}")
    print(f"{camera_id}: Probe completed.")

    video_stream = next(
        (stream for stream in probe["streams"] if stream["codec_type"] == "video"),
        None,
    )
    if video_stream is None:
        raise CommandError(f"{camera_id}: No video stream found during probe.")

    print(video_stream)
    codec_name = video_stream["codec_name"]
    width = int(video_stream["width"])
    height = int(video_stream["height"])
    try:
        frame_rate_parts = video_stream["avg_frame_rate"].split("/")
        frame_rate = int(frame_rate_parts[0]) / int(frame_rate_parts[1])
    except ZeroDivisionError:
        frame_rate_parts = video_stream["r_frame_rate"].split("/")
        frame_rate = int(frame_rate_parts[0]) / int(frame_rate_parts[1])

    print()
    print(f"{camera_id}: Stream configuration:")
    print(f"{camera_id}: - Codec:       {codec_name}")
    print(f"{camera_id}: - Size:        {width}x{height}")
    print(f"{camera_id}: - Frame rate:  {frame_rate}", flush=True)

    ds = get_detection_settings(camera)

    drawtext_enabled = True if camera.overlays.count() > 0 else False
    drawbox_enabled = (
        ds["md_visualize"]
        or ds["od_visualize"]
        or ds["fd_visualize"]
        or ds["ld_visualize"]
    )
    detect_enabled = (
        drawbox_enabled
        or ds["md_enabled"]
        or ds["od_enabled"]
        or ds["fd_enabled"]
        or ds["ld_enabled"]
    )

    print()
    print(f"{camera_id}: Feature configuration:")
    print(f"{camera_id}: - Detection:       {detect_enabled}")
    print(f"{camera_id}:   - Visualization: {drawbox_enabled}")
    print(f"{camera_id}: - Text overlay:    {drawtext_enabled}", flush=True)

    decode_enabled = detect_enabled
    encode_enabled = drawtext_enabled or drawbox_enabled
    copy_enabled = not encode_enabled and (codec_name == "h264")

    decode_width, decode_height = 1280, 720

    print()
    print(f"{camera_id}: Pipeline configuration:")
    print(f"{camera_id}: - Decode:  {decode_enabled}")
    print(f"{camera_id}:   - Size:  {decode_width}x{decode_height}")
    print(f"{camera_id}: - Encode:  {encode_enabled}")
    print(f"{camera_id}: - Copy:    {copy_enabled}", flush=True)

    # TODO: Detect hwaccel availability
    nvdec_available = True
    nvenc_available = True
    vaapi_available = False

    # TODO: Hardware-accelerate decode
    if nvdec_available:
        decode_params = {"hwaccel": "cuda"}
    elif vaapi_available:
        decode_params = {"hwaccel": "vaapi"}
    else:
        decode_params = {}

    if copy_enabled:
        vcodec_encode = "copy"
    elif nvenc_available:
        vcodec_encode = "h264_nvenc"
    elif vaapi_available:
        vcodec_encode = "h264_vaapi"
    else:
        vcodec_encode = "libx264"

    global_params = {
        "hide_banner": None,
        "loglevel": "error",
    }

    rtsp_params = {"stimeout": 5000000}
    if camera.camera_type.streams.all()[0].force_tcp:
        rtsp_params["rtsp_transport"] = "tcp"

    rawvideo_params = {
        "format": "rawvideo",
        "pix_fmt": "rgb24",
        "s": f"{decode_width}x{decode_height}",
    }

    hls_params = {
        "flags": "+cgop",
        "g": frame_rate,
        "hls_time": 1,
        "hls_list_size": 900,
        "hls_flags": "delete_segments",
    }

    mp4_params = {
        "movflags": "+faststart",
    }

    stream_dir = f"{settings.STORAGE_DIR}/stream/{camera.id}"
    record_dir = f"{settings.STORAGE_DIR}/record/{camera.id}"

    makedirs(stream_dir, exist_ok=True)
    rmtree(stream_dir)
    makedirs(stream_dir, exist_ok=True)

    makedirs(record_dir, exist_ok=True)

    fifo_path = mkfifotemp("h264")

    inputs = [
        ffmpeg.input(
            stream_url,
            **global_params,
            **decode_params,
            **rtsp_params,
        )
    ]
    outputs = [[]]

    if decode_enabled:
        decode_scaled = inputs[0].filter("scale", decode_width, decode_height)
        outputs[0].append(decode_scaled.output("pipe:", **rawvideo_params))

    if drawbox_enabled:
        inputs.append(ffmpeg.input("pipe:", **global_params, **rawvideo_params))
        outputs.append([])

    if drawtext_enabled:
        drawtext = inputs[-1].drawtext("Hello, world!")
        split = drawtext.filter_multi_output("split")
        splits = [split.stream(0), split.stream(1)]
    else:
        splits = [inputs[-1], inputs[-1]]

    outputs[-1].append(
        splits[0].output(
            f"{stream_dir}/out.m3u8",
            vcodec=vcodec_encode,
            **hls_params,
        )
    )
    outputs[-1].append(
        splits[1]
        .output(
            fifo_path,
            vcodec=vcodec_encode,
        )
        .overwrite_output()
    )

    main_cmds = [ffmpeg.merge_outputs(*output) for output in outputs]

    if detect_enabled:
        from ultralytics import YOLO

        print(f"{camera_id}: Loading YOLOv8 model...", flush=True)
        model = YOLO("yolov8n.pt")
        frame = np.zeros([decode_height, decode_width, 3])
        model.track(frame, half=True, verbose=False)
        print(f"{camera_id}: Loaded yolov8n.pt.")

        print(f"{camera_id}: Setting CPU affinity...", flush=True)
        cpus = list(sched_getaffinity(0))
        affinity = {cpus[camera_id % len(cpus)]}
        sched_setaffinity(0, affinity)
        print(f"{camera_id}: Set affinity to {affinity}.")

    print()
    print(f"{camera_id}: Starting stream...", flush=True)
    main_processes = [
        main_cmd.run_async(pipe_stdin=True, pipe_stdout=True) for main_cmd in main_cmds
    ]
    print(f"{camera_id}: Started stream.")

    print()
    print(f"{camera_id}: Starting segmented recorder...", flush=True)
    record_process = Process(
        target=segment_h264,
        args=(
            camera,
            fifo_path,
            f"{record_dir}/VID_%Y%m%d_%H%M%S.mp4",
            mp4_params,
        ),
        name=f"'{camera.name}'-record",
    )
    record_process.start()
    print(f"{camera_id}: Started segmented recorder.")

    manual_exit = False

    try:
        if decode_enabled:
            print()
            print(f"{camera_id}: Starting overlay loop...", flush=True)

            frame_size = decode_width * decode_height * 3
            frame_buffer = bytearray(frame_size)

            counter = 0
            start = time.time()

            while all(main_process.poll() is None for main_process in main_processes):
                frame_pos = 0
                while frame_pos < frame_size:
                    frame_view = memoryview(frame_buffer)[frame_pos:]
                    in_bytes = main_processes[0].stdout.readinto(frame_view)
                    if not in_bytes:
                        main_processes[0].terminate()
                        break
                    frame_pos += in_bytes

                if frame_pos != frame_size:
                    continue
                frame = np.frombuffer(frame_buffer, np.uint8).reshape(
                    [decode_height, decode_width, 3]
                )

                if detect_enabled:
                    results = model.track(frame, half=True, verbose=False)
                    pass

                if drawbox_enabled:
                    frame = results[0].plot()
                    main_processes[1].stdin.write(frame.tobytes())

                counter += 1
                if counter == int(frame_rate) * 10:
                    end = time.time()
                    fps = counter / (end - start)
                    print(f"{camera_id}: {fps} fps")
                    counter = 0
                    start = end

        else:
            print()
            print(f"{camera_id}: Waiting for end of stream...", flush=True)
            for main_process in main_processes:
                main_process.wait()

        print(
            f"{camera_id}: Stream ended. Statuses: {[main_process.returncode for main_process in main_processes]})"
        )

    except KeyboardInterrupt:
        manual_exit = True

    print()
    print(f"{camera_id}: Stopping segmented recorder...", flush=True)

    for main_process in main_processes:
        main_process.terminate()
    kill(record_process.pid, SIGINT)
    record_process.join()

    camera.refresh_from_db()
    camera.last_ping = None
    camera.save()

    print(f"{camera_id}: All done.")

    if not manual_exit:
        exit(2)


def segment_h264(camera, input_fifo_path, record_path, mp4_params):
    buffer = []
    next_split = timezone.now().replace(minute=int(timezone.now().minute / 15) * 15)
    record_process = None
    start_date = None
    file_path = None

    with open(input_fifo_path, "rb") as input_stream:
        try:
            while True:
                b = input_stream.read(1)
                if b == "":
                    break

                while len(buffer) >= 5:
                    p = buffer.pop(0)
                    if record_process is not None:
                        record_process.stdin.write(p)
                buffer.append(b)

                if (
                    buffer == [b"\x00", b"\x00", b"\x00", b"\x01", b"\x67"]
                    and timezone.now() > next_split
                ):
                    current_date = timezone.now()

                    if record_process is not None:
                        record_process.stdin.close()
                        record_process.wait()
                        Video.objects.create(
                            camera=camera,
                            start_date=start_date,
                            end_date=current_date,
                            file="/".join(file_path.split("/")[-3:]),
                        )

                    start_date = current_date
                    file_path = start_date.strftime(record_path)
                    record_cmd = (
                        ffmpeg.input(
                            "pipe:",
                        )
                        .output(
                            file_path,
                            vcodec="copy",
                            **mp4_params,
                        )
                        .global_args(
                            "-hide_banner",
                            "-loglevel",
                            "error",
                        )
                        .overwrite_output()
                    )
                    record_process = record_cmd.run_async(pipe_stdin=True)

                    camera.refresh_from_db()
                    camera.last_ping = current_date
                    camera.save()

                    next_split += timedelta(minutes=15)

        except KeyboardInterrupt:
            pass

        if record_process is not None:
            record_process.stdin.close()
            record_process.wait()
            Video.objects.create(
                camera=camera,
                start_date=start_date,
                end_date=timezone.now(),
                file="/".join(file_path.split("/")[-3:]),
            )


class Command(BaseCommand):
    help = "Starts streaming the specified camera"

    def add_arguments(self, parser):
        parser.add_argument("--camera", type=int)

    def handle(self, *args, **options):
        if options.get("camera", None) is None:
            print("Streaming all cameras...")
            qs = Camera.objects.all()
            processes = [
                Process(target=handle_stream, args=(c.id,), name=f"'{c.name}'-main")
                for c in qs
            ]
            for p in processes:
                p.start()
            for p in processes:
                p.join()
        else:
            handle_stream(options["camera"])
