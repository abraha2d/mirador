from errno import ENXIO

from select import PIPE_BUF, select

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
    CODEC_RAWAUDIO,
    FF_GLOBAL_ARGS,
    HXXX_NALU_HEADER,
    HXXX_NALU_HEADER_SIZE,
    RAWAUDIO_SAMPLE_SIZE,
    READ_MAX_SIZE,
    RECORD_SEGMENT_MINS,
)
from worker.management.commands.utils import mkfifotemp


class LazyFD:
    def __init__(self, path: str, flags: int):
        self.path = path
        self.flags = flags
        self._fileno = None

    def close(self):
        if self._fileno is not None:
            os.close(self._fileno)
            self._fileno = None

    def fileno(self):
        if self._fileno is None:
            try:
                self._fileno = os.open(self.path, self.flags | O_NONBLOCK)
            except OSError as e:
                if e.errno != ENXIO:
                    raise e
        return self._fileno


def filter_fds(fds: list[LazyFD]):
    return [fd for fd in fds if fd.fileno() is not None]


def segment_hxxx(
    camera: Camera,
    record_path: str,
    hxxx_in_codec: str,
    hxxx_in_path: str,
    has_audio: bool,
    rawaudio_in_path: str,
    rawaudio_params,
):
    hxxx_in_fd = LazyFD(hxxx_in_path, O_RDONLY)
    hxxx_buffer, hxxx_out_path = bytearray(), mkfifotemp(hxxx_in_codec)
    hxxx_out_fd = LazyFD(hxxx_out_path, O_WRONLY)
    hxxx_in_stats, hxxx_out_stats = 0, 0

    rawaudio_in_fd = LazyFD(rawaudio_in_path, O_RDONLY)
    rawaudio_buffer, rawaudio_out_path = bytearray(), mkfifotemp(CODEC_RAWAUDIO)
    rawaudio_out_fd = LazyFD(rawaudio_out_path, O_WRONLY)
    rawaudio_in_stats, rawaudio_out_stats = 0, 0

    ffmpeg_input = (
        ffmpeg.input(
            rawaudio_out_path,
            **rawaudio_params,
        )
        if has_audio
        else ffmpeg.input(hxxx_out_path)
    )

    audio_hack = {"i": hxxx_out_path} if has_audio else {}
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
                minute=start_date.minute // RECORD_SEGMENT_MINS * RECORD_SEGMENT_MINS,
                second=0,
                microsecond=0,
            ) + timedelta(minutes=RECORD_SEGMENT_MINS)
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

            i = 0
            should_print_stats = timezone.now()

            while True:
                i += 1

                rlist, wlist, _ = select(
                    filter_fds([hxxx_in_fd, rawaudio_in_fd]),
                    filter_fds([hxxx_out_fd, rawaudio_out_fd]),
                    [],
                )

                hxxx_in_stats -= len(hxxx_buffer)

                if hxxx_in_fd in rlist:
                    hxxx_buffer.extend(os.read(hxxx_in_fd.fileno(), READ_MAX_SIZE))

                hxxx_in_stats += len(hxxx_buffer)
                hxxx_out_stats += len(hxxx_buffer)

                if hxxx_out_fd in wlist and len(hxxx_buffer) > HXXX_NALU_HEADER_SIZE:
                    flush_to = hxxx_buffer.rfind(
                        HXXX_NALU_HEADER,
                        HXXX_NALU_HEADER_SIZE,
                        PIPE_BUF,
                    )
                    if flush_to == -1:
                        flush_to = min(
                            len(hxxx_buffer) - HXXX_NALU_HEADER_SIZE, PIPE_BUF
                        )
                    os.write(hxxx_out_fd.fileno(), hxxx_buffer[:flush_to])
                    del hxxx_buffer[:flush_to]

                hxxx_out_stats -= len(hxxx_buffer)
                rawaudio_in_stats -= len(rawaudio_buffer)

                if rawaudio_in_fd in rlist:
                    rawaudio_buffer.extend(
                        os.read(rawaudio_in_fd.fileno(), READ_MAX_SIZE)
                    )

                rawaudio_in_stats += len(rawaudio_buffer)
                rawaudio_out_stats += len(rawaudio_buffer)

                if rawaudio_out_fd in wlist and len(rawaudio_buffer) > 0:
                    flush_to = (
                        len(rawaudio_buffer)
                        // RAWAUDIO_SAMPLE_SIZE
                        * RAWAUDIO_SAMPLE_SIZE
                    )
                    os.write(rawaudio_out_fd.fileno(), rawaudio_buffer[:flush_to])
                    del rawaudio_buffer[:flush_to]

                rawaudio_out_stats -= len(rawaudio_buffer)

                if timezone.now() > should_print_stats:
                    print(
                        f"V+{hxxx_in_stats:6}-{hxxx_out_stats:6}={len(hxxx_buffer):6} "
                        f"A+{rawaudio_in_stats:6}-{rawaudio_out_stats:6}={len(rawaudio_buffer):6} "
                        f"I={i}",
                        flush=True,
                    )

                    hxxx_in_stats, hxxx_out_stats = 0, 0
                    rawaudio_in_stats, rawaudio_out_stats = 0, 0

                    i = 0
                    should_print_stats = timezone.now() + timedelta(seconds=1)

                if (
                    hxxx_buffer[:HXXX_NALU_HEADER_SIZE] == HXXX_NALU_HEADER
                    and timezone.now() > next_split
                ):
                    print("   === split point ===   ", flush=True)
                    break

            current_date = timezone.now()

            hxxx_out_fd.close()
            rawaudio_out_fd.close()

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

    hxxx_in_fd.close()
    hxxx_out_fd.close()

    rawaudio_in_fd.close()
    rawaudio_out_fd.close()

    if record_process is not None:
        try:
            record_process.wait(5)
        except TimeoutExpired:
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
