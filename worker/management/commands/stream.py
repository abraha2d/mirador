from camera.models import Camera
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from multiprocessing import Process
from os import kill, makedirs
from shutil import rmtree
from signal import SIGINT
from subprocess import TimeoutExpired
from time import sleep

from worker.management.commands.constants import (
    CODEC_H264,
    DECODE_SIZE,
    CODEC_RAWAUDIO,
    RECORD_DIR,
    RECORD_FILENAME,
    STREAM_DIR,
)
from worker.management.commands.pipeline import load_model, run_pipeline
from worker.management.commands.segmenter import segment_hxxx
from worker.management.commands.utils import (
    get_feature_config,
    get_ffmpeg_cmds,
    get_hxxx_output,
    get_stream_config,
    mkfifotemp,
)


def handle_stream(camera_id):
    try:
        camera = Camera.objects.get(pk=camera_id)
    except Camera.DoesNotExist:
        raise CommandError(f"Camera {camera_id} does not exist")

    if not camera.enabled:
        print(f"'{camera.name}' is disabled.")
        return

    stream_config = get_stream_config(camera)
    stream_url, codec_name, size, frame_rate, has_audio, rtsp_params = stream_config
    width, height = size

    print()
    print(f"{camera_id}: Stream configuration:")
    print(f"{camera_id}: - Codec:       {codec_name}")
    print(f"{camera_id}: - Size:        {width}x{height}")
    print(f"{camera_id}: - Frame rate:  {frame_rate}")
    print(f"{camera_id}: - Audio:       {has_audio}", flush=True)

    feature_config = get_feature_config(camera)
    detect_enabled, drawbox_enabled, drawtext_enabled = feature_config

    print()
    print(f"{camera_id}: Feature configuration:")
    print(f"{camera_id}: - Detection:       {detect_enabled}")
    print(f"{camera_id}:   - Visualization: {drawbox_enabled}")
    print(f"{camera_id}: - Text overlay:    {drawtext_enabled}", flush=True)

    decode_enabled = detect_enabled
    encode_enabled = drawtext_enabled or drawbox_enabled
    # copy_enabled = not encode_enabled and codec_name in HXXX_CODECS  # HEVC can't be played without browser hwaccel
    copy_enabled = not encode_enabled and codec_name == CODEC_H264

    decode_size = DECODE_SIZE  # TODO: cap to `size`
    decode_width, decode_height = decode_size

    print()
    print(f"{camera_id}: Pipeline configuration:")
    print(f"{camera_id}: - Decode:  {decode_enabled}")
    if decode_enabled:
        print(f"{camera_id}:   - Size:  {decode_width}x{decode_height}")
    print(f"{camera_id}: - Encode:  {encode_enabled}")
    print(f"{camera_id}: - Copy:    {copy_enabled}", flush=True)

    hxxx_codec = get_hxxx_output(codec_name)
    hxxx_out_path = mkfifotemp(hxxx_codec)
    rawaudio_out_path = mkfifotemp(CODEC_RAWAUDIO)
    rawaudio_params = {
        "f": CODEC_RAWAUDIO,
        "ar": 8000,  # TODO: adapt rate to source
        "channel_layout": "mono",  # TODO: adapt layout to source
    }

    record_dir = f"{settings.STORAGE_DIR}/{RECORD_DIR}/{camera.id}"
    makedirs(record_dir, exist_ok=True)

    stream_dir = f"{settings.STORAGE_DIR}/{STREAM_DIR}/{camera.id}"
    rmtree(stream_dir, ignore_errors=True)
    makedirs(stream_dir)

    ffmpeg_cmds = get_ffmpeg_cmds(
        (copy_enabled, decode_width, decode_height),
        feature_config,
        hxxx_out_path,
        rawaudio_out_path,
        rawaudio_params,
        stream_config,
        stream_dir,
    )

    if detect_enabled:
        model = load_model(camera_id, decode_size)

    print()
    print(f"{camera_id}: Starting streams...", flush=True)
    ff_processes = [
        ffmpeg_cmd.run_async(pipe_stdin=True, pipe_stdout=True)
        for ffmpeg_cmd in ffmpeg_cmds
    ]
    print(f"{camera_id}: Started streams.")

    pids = [ff_process.pid for ff_process in ff_processes]
    print(f"{camera.id}: - Stream process PIDs: {pids}")

    camera.refresh_from_db()
    camera.stream_start = timezone.now()
    camera.save()

    print()
    print(f"{camera_id}: Starting segmented recorder...", flush=True)
    record_process = Process(
        target=segment_hxxx,
        args=(
            camera,
            frame_rate,
            f"{record_dir}/{RECORD_FILENAME}",
            hxxx_codec,
            hxxx_out_path,
            has_audio,
            rawaudio_out_path,
            rawaudio_params,
        ),
        name=f"'{camera.name}'-record",
    )
    record_process.start()
    print(f"{camera_id}: Started segmented recorder.")
    print(f"{camera.id}: - Segmented recorder PID: {record_process.pid}")

    manual_exit = False

    try:
        if detect_enabled:
            run_pipeline(
                camera_id,
                decode_size,
                feature_config,
                ff_processes,
                model,
            )
        else:
            print()
            print(f"{camera_id}: Waiting for end of stream...", flush=True)
            while all(
                [
                    record_process.is_alive(),
                    *(p.poll() is None for p in ff_processes),
                ]
            ):
                sleep(1)

        rcs = [ff_process.returncode for ff_process in ff_processes]
        print(f"{camera_id}: Stream ended. RCs: {rcs}, R = {record_process.is_alive()}")

    except KeyboardInterrupt:
        manual_exit = True

    print()
    print(f"{camera_id}: Signalling streams to stop...", flush=True)
    for ff_process in ff_processes:
        ff_process.terminate()
        try:
            ff_process.wait(5)
        except TimeoutExpired:
            ff_process.kill()
        ff_process.wait()

    print()
    print(f"{camera_id}: Waiting for segmented recorder...", flush=True)
    if not manual_exit:
        try:
            kill(record_process.pid, SIGINT)
        except ProcessLookupError:
            pass
    record_process.join()

    print(f"{camera_id}: All done.")

    if not manual_exit:
        exit(2)


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
