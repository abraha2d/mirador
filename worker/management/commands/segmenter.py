from errno import ENXIO

from select import select

import ffmpeg
import os
from camera.models import Camera
from datetime import timedelta
from django.utils import timezone
from os import O_NONBLOCK, O_RDONLY, O_WRONLY
from storage.models import Video
from subprocess import TimeoutExpired
from traceback import print_exception
from worker.management.commands.constants import (
    FF_GLOBAL_ARGS,
    H264_EXT,
    H264_NALU_HEADER,
    RAWAUDIO_EXT,
)
from worker.management.commands.utils import mkfifotemp


def segment_h264(
    camera: Camera,
    record_path: str,
    h264_in_path: str,
    has_audio: bool,
    rawaudio_in_path: str,
    rawaudio_params,
):
    h264_in_fd, h264_buffer = None, bytearray()
    h264_out_path, h264_out_fd = mkfifotemp(H264_EXT), None

    rawaudio_in_fd, rawaudio_buffer = None, bytearray()
    rawaudio_out_path, rawaudio_out_fd = mkfifotemp(RAWAUDIO_EXT), None

    ffmpeg_input = (
        ffmpeg.input(
            rawaudio_out_path,
            **rawaudio_params,
        )
        if has_audio
        else ffmpeg.input(h264_out_path)
    )

    audio_hack = {"i": h264_out_path} if has_audio else {}
    record_params = {
        **audio_hack,  # TODO: this only works because "i" is alphabetically first in the list of params
        "movflags": "+faststart",
        "vcodec": "copy",
    }

    current_date = timezone.now()
    record_process = None
    start_date = None

    try:
        while True:
            start_date = current_date
            next_split = start_date.replace(
                minute=start_date.minute // 15 * 15
            ) + timedelta(minutes=15)
            file_path = start_date.strftime(record_path)

            record_cmd = (
                ffmpeg_input.output(
                    file_path,
                    **record_params,
                )
                .global_args(*FF_GLOBAL_ARGS)
                .overwrite_output()
            )
            record_process = record_cmd.run_async()

            camera.refresh_from_db()
            camera.last_ping = current_date
            camera.save()

            rfds = []
            wfds = []

            while True:
                if h264_in_fd is None:
                    try:
                        h264_in_fd = os.open(h264_in_path, O_RDONLY | O_NONBLOCK)
                        rfds.append(h264_in_fd)
                    except OSError as e:
                        if e.errno != ENXIO:
                            raise e

                if h264_out_fd is None:
                    try:
                        h264_out_fd = os.open(h264_out_path, O_WRONLY | O_NONBLOCK)
                        wfds.append(h264_out_fd)
                    except OSError as e:
                        if e.errno != ENXIO:
                            raise e

                if rawaudio_in_fd is None:
                    try:
                        rawaudio_in_fd = os.open(
                            rawaudio_in_path, O_RDONLY | O_NONBLOCK
                        )
                        rfds.append(rawaudio_in_fd)
                    except OSError as e:
                        if e.errno != ENXIO:
                            raise e

                if rawaudio_out_fd is None:
                    try:
                        rawaudio_out_fd = os.open(
                            rawaudio_out_path, O_WRONLY | O_NONBLOCK
                        )
                        wfds.append(rawaudio_out_fd)
                    except OSError as e:
                        if e.errno != ENXIO:
                            raise e

                rlist, wlist, _ = select(rfds, wfds, [])

                if h264_in_fd in rlist:
                    h264_buffer.extend(os.read(h264_in_fd, 1048576))

                if h264_out_fd in wlist and len(h264_buffer) > len(H264_NALU_HEADER):
                    flush_to = h264_buffer.find(
                        H264_NALU_HEADER,
                        len(H264_NALU_HEADER),
                    )
                    if flush_to == -1:
                        flush_to = -len(H264_NALU_HEADER)
                    os.write(h264_out_fd, h264_buffer[:flush_to])
                    del h264_buffer[:flush_to]

                if rawaudio_in_fd in rlist:
                    rawaudio_buffer.extend(os.read(rawaudio_in_fd, 1048576))

                if rawaudio_out_fd in wlist and len(rawaudio_buffer):
                    os.write(rawaudio_out_fd, rawaudio_buffer)
                    del rawaudio_buffer[:]

                if (
                    h264_buffer[: len(H264_NALU_HEADER)] == H264_NALU_HEADER
                    and timezone.now() > next_split
                ):
                    break

            current_date = timezone.now()

            os.close(h264_out_fd)
            h264_out_fd = None

            os.close(rawaudio_out_fd)
            rawaudio_out_fd = None

            record_process.wait()
            Video.objects.create(
                camera=camera,
                start_date=start_date,
                end_date=current_date,
                file="/".join(file_path.split("/")[-3:]),
            )

    except KeyboardInterrupt as e:
        print_exception(e)
        pass

    if h264_out_fd is not None:
        os.close(h264_out_fd)

    if rawaudio_out_fd is not None:
        os.close(rawaudio_out_fd)

    if record_process is not None:
        record_process.terminate()
        try:
            record_process.wait(5)
        except TimeoutExpired:
            record_process.kill()
            record_process.wait()

    if start_date is not None:
        file_path = start_date.strftime(record_path)
        Video.objects.create(
            camera=camera,
            start_date=start_date,
            end_date=timezone.now(),
            file="/".join(file_path.split("/")[-3:]),
        )
