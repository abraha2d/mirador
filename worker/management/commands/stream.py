from datetime import datetime, timedelta
from multiprocessing import Process
from os import mkfifo, makedirs
from os.path import join
from sys import stderr
from tempfile import mkdtemp
from time import strftime

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand, CommandError

import ffmpeg
import numpy as np

from camera.models import Camera


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
    print("Fetching camera details...")
    try:
        camera = Camera.objects.get(pk=camera_id)
    except Camera.DoesNotExist:
        raise CommandError('Camera "%s" does not exist' % camera_id)

    if not camera.enabled:
        print(f"'{camera.name}' is disabled, exiting...")
        exit(1)

    stream_url = camera.urls()[0]

    print("Probing camera...")
    try:
        probe = ffmpeg.probe(stream_url)
    except ffmpeg.Error as e:
        print(e.stderr.decode("utf-8"), file=stderr)
        exit(1)

    video_stream = next(
        (stream for stream in probe["streams"] if stream["codec_type"] == "video"),
        None,
    )
    if video_stream is None:
        print("No video stream found", file=stderr)
        exit(1)

    codec_name = video_stream["codec_name"]
    width = int(video_stream["width"])
    height = int(video_stream["height"])
    r_frame_rate_parts = video_stream["r_frame_rate"].split("/")
    r_frame_rate = int(r_frame_rate_parts[0]) / int(r_frame_rate_parts[1])

    print("Getting camera settings...")

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

    print("Setting up pipelines...")

    decode_enabled = detect_enabled
    overlay_enabled = drawtext_enabled and drawbox_enabled
    encode_enabled = drawtext_enabled or drawbox_enabled
    transcode_enabled = not encode_enabled
    copy_enabled = transcode_enabled and (codec_name == "h264" or codec_name == "hevc")

    # TODO: Add appropriate hardware acceleration
    # Intel/AMD:
    #   -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi -i <input> -c:v h264_vaapi <output>
    # Nvidia:
    #   -hwaccel cuda -hwaccel_output_format cuda -i <input> -c:v h264_nvenc <output>

    rawvideo_params = {
        "format": "rawvideo",
        "pix_fmt": "rgb24",
        "s": f"{width}x{height}",
    }

    hls_params = {
        "flags": "+cgop",
        "g": r_frame_rate * 2,
        "hls_flags": "delete_segments",
    }

    h264_params = {
        # "f": "h264",
        # "r": r_frame_rate,
    }

    mp4_params = {
        "movflags": "+faststart",
    }

    print("Preparing stream...")

    stream_dir = f"{settings.STATICFILES_DIRS[0]}/stream/{camera.id}"
    record_dir = f"{settings.STATICFILES_DIRS[0]}/record/{camera.id}"
    makedirs(stream_dir, exist_ok=True)
    makedirs(record_dir, exist_ok=True)

    fifo_path = mkfifotemp("h264")

    output = ffmpeg.input(stream_url, rtsp_transport="tcp")
    outputs = []

    if decode_enabled:
        outputs.append(output.output("pipe:", **rawvideo_params))
    if drawtext_enabled:
        drawtext = output.drawtext("Hello, world!")
        output = drawtext
    if drawbox_enabled:
        drawbox = ffmpeg.input("pipe:", **rawvideo_params)
        output = drawbox
    if overlay_enabled:
        output = ffmpeg.overlay(drawtext, drawbox)

    if encode_enabled:
        split = output.filter_multi_output("split")
        inputs = [split.stream(0), split.stream(1)]
    else:
        inputs = [output, output]

    outputs.append(
        inputs[0].output(
            f"{stream_dir}/out.m3u8",
            vcodec="copy" if copy_enabled else "h264_vaapi",
            **hls_params,
        )
    )
    outputs.append(
        inputs[1]
        .output(fifo_path, vcodec="copy" if copy_enabled else "h264", **h264_params)
        .overwrite_output()
    )

    main_cmd = ffmpeg.merge_outputs(*outputs)
    main_cmd = main_cmd.global_args(
        "-use_wallclock_as_timestamps", "-hide_banner", "-loglevel", "error"
    )

    print("Starting stream...")

    print(" ".join(main_cmd.compile()))
    main_process = main_cmd.run_async(pipe_stdin=True, pipe_stdout=True)

    record_process = Process(
        target=segment_h264,
        args=(
            fifo_path,
            h264_params,
            f"{record_dir}/VID_%Y%m%d_%H%M%S.mp4",
            mp4_params,
        ),
    )
    record_process.start()

    try:
        while True:
            if decode_enabled:
                in_bytes = main_process.stdout.read(width * height * 3)
                if not in_bytes:
                    break
                frame = np.frombuffer(in_bytes, np.uint8).reshape([height, width, 3])

                if detect_enabled:
                    # TODO: Do detection on frame
                    pass

                if drawbox_enabled:
                    # TODO: Do drawbox on frame
                    pass

                    main_process.stdin.write(frame.astype(np.uint8).tobytes())

        main_process.wait()

    except KeyboardInterrupt:
        print("Stopping stream...")
        main_process.terminate()

    record_process.terminate()


def segment_h264(input_fifo_path, h264_params, record_path, mp4_params):
    record_process = None
    output_stream = None

    buffer = []

    next_split = datetime.now().replace(second=0)

    print("Starting segmented recorder...")

    with open(input_fifo_path, "rb") as input_stream:
        try:
            while True:
                b = input_stream.read(1)
                if b == "":
                    break

                while len(buffer) >= 5:
                    p = buffer.pop(0)
                    if output_stream is not None:
                        output_stream.write(p)
                buffer.append(b)

                if (
                    buffer == [b"\x00", b"\x00", b"\x00", b"\x01", b"\x67"]
                    and datetime.now() > next_split
                ):
                    if output_stream is not None:
                        output_stream.close()
                        record_process.wait()

                    output_fifo_path = mkfifotemp("h264")
                    record_cmd = (
                        ffmpeg.input(
                            output_fifo_path,
                            **h264_params,
                        )
                        .output(
                            strftime(record_path),
                            vcodec="copy",
                            **mp4_params,
                        )
                        .global_args(
                            "-use_wallclock_as_timestamps",
                            "-hide_banner",
                            "-loglevel",
                            "error",
                        )
                        .overwrite_output()
                    )
                    print(" ".join(record_cmd.compile()))
                    record_process = record_cmd.run_async()
                    output_stream = open(output_fifo_path, "wb")

                    next_split += timedelta(minutes=1)

        except KeyboardInterrupt:
            print("Stopping segmented recorder...")

        if output_stream is not None:
            output_stream.close()
            record_process.wait()


class Command(BaseCommand):
    help = "Starts streaming the specified camera"

    def add_arguments(self, parser):
        parser.add_argument("--camera", type=int)

    def handle(self, *args, **options):
        if options.get("camera", None) is None:
            print("Streaming all cameras...")
            qs = Camera.objects.all()
            processes = [Process(target=handle_stream, args=(c.id,)) for c in qs]
            for p in processes:
                p.start()
            for p in processes:
                p.join()
        else:
            handle_stream(options["camera"])
