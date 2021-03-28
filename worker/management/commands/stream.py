from datetime import timedelta
from multiprocessing import Process
from os import kill, mkfifo, makedirs
from os.path import join
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
        raise CommandError(f'Camera "{camera_id}" does not exist')

    if not camera.enabled:
        print(f"'{camera.name}' is disabled.")
        return

    stream_url = camera.urls()[0]

    print(f"{camera_id}: Probing camera...")
    probe = ffmpeg.probe(stream_url)
    print(f"{camera_id}: Probe completed.")

    video_stream = next(
        (stream for stream in probe["streams"] if stream["codec_type"] == "video"),
        None,
    )
    if video_stream is None:
        raise CommandError(f"{camera_id}: No video stream found during probe.")

    codec_name = video_stream["codec_name"]
    width = int(video_stream["width"])
    height = int(video_stream["height"])
    r_frame_rate_parts = video_stream["r_frame_rate"].split("/")
    r_frame_rate = int(r_frame_rate_parts[0]) / int(r_frame_rate_parts[1])

    print()
    print(f"{camera_id}: Stream configuration:")
    print(f"{camera_id}: - Codec:       {codec_name}")
    print(f"{camera_id}: - Size:        {width}x{height}")
    print(f"{camera_id}: - Frame rate:  {r_frame_rate}")

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
    print(f"{camera_id}: - Text overlay:    {drawtext_enabled}")

    decode_enabled = detect_enabled
    overlay_enabled = drawtext_enabled and drawbox_enabled
    encode_enabled = drawtext_enabled or drawbox_enabled
    transcode_enabled = not encode_enabled
    copy_enabled = transcode_enabled and (codec_name == "h264" or codec_name == "hevc")

    print()
    print(f"{camera_id}: Pipeline configuration:")
    print(f"{camera_id}: - Decode:  {decode_enabled}")
    print(f"{camera_id}: - Merge:   {overlay_enabled}")
    print(
        f"""{camera_id}: - Output:  {'Encode' if encode_enabled
        else ('Copy' if copy_enabled else 'Transcode')}"""
    )

    # TODO: Add appropriate hardware acceleration
    # Intel/AMD:
    #   -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi
    #   -i <input> -c:v h264_vaapi <output>
    # Nvidia:
    #   -hwaccel cuda -hwaccel_output_format cuda
    #   -i <input> -c:v h264_nvenc <output>

    rawvideo_params = {
        "format": "rawvideo",
        "pix_fmt": "rgb24",
        "s": f"{width}x{height}",
    }

    hls_params = {
        "flags": "+cgop",
        "g": r_frame_rate,
        "hls_time": 1,
        "hls_flags": "delete_segments",
        "hls_playlist_type": "event",
    }

    mp4_params = {
        "movflags": "+faststart",
    }

    stream_dir = f"{settings.STORAGE_DIR}/stream/{camera.id}"
    record_dir = f"{settings.STORAGE_DIR}/record/{camera.id}"
    makedirs(stream_dir, exist_ok=True)
    makedirs(record_dir, exist_ok=True)

    fifo_path = mkfifotemp("h264")

    output = ffmpeg.input(
        stream_url,
        **(
            {"rtsp_transport": "tcp"}
            if camera.camera_type.streams.all()[0].force_tcp
            else {}
        ),
    )
    outputs = []

    drawtext = None
    drawbox = None

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
        .output(fifo_path, vcodec="copy" if copy_enabled else "h264")
        .overwrite_output()
    )

    main_cmd = ffmpeg.merge_outputs(*outputs)
    main_cmd = main_cmd.global_args("-hide_banner", "-loglevel", "error")

    print()
    print(f"{camera_id}: Starting stream...")
    main_process = main_cmd.run_async(pipe_stdin=True, pipe_stdout=True)
    print(f"{camera_id}: Started stream.")

    print()
    print(f"{camera_id}: Starting segmented recorder...")
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
            print(f"{camera_id}: Starting overlay loop...")

            while main_process.poll() is None:
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

        else:
            print()
            print(f"{camera_id}: Waiting for end of stream...")
            main_process.wait()

        print(f"{camera_id}: Stream ended. Status: {main_process.returncode})")

    except KeyboardInterrupt:
        manual_exit = True

    print()
    print(f"{camera_id}: Stopping stream and segmented recorder...")

    main_process.terminate()
    kill(record_process.pid, SIGINT)
    record_process.join()

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
