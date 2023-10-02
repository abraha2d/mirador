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
    FF_GLOBAL_ARGS,
    H264_EXT,
    H264_NALU_HEADER,
    H264_NALU_HEADER_SIZE,
    RAWAUDIO_EXT,
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


def segment_h264(
    camera: Camera,
    record_path: str,
    h264_in_path: str,
    has_audio: bool,
    rawaudio_in_path: str,
    rawaudio_params,
):
    h264_in_fd = LazyFD(h264_in_path, O_RDONLY)
    h264_buffer, h264_out_path = bytearray(), mkfifotemp(H264_EXT)
    h264_out_fd = LazyFD(h264_out_path, O_WRONLY)

    rawaudio_in_fd = LazyFD(rawaudio_in_path, O_RDONLY)
    rawaudio_buffer, rawaudio_out_path = bytearray(), mkfifotemp(RAWAUDIO_EXT)
    rawaudio_out_fd = LazyFD(rawaudio_out_path, O_WRONLY)

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

    rawaudio_bps = RAWAUDIO_SAMPLE_SIZE * rawaudio_params["ar"]

    try:
        while True:
            start_date = current_date
            next_split = start_date.replace(
                minute=start_date.minute // RECORD_SEGMENT_MINS * RECORD_SEGMENT_MINS
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

            rawaudio_sent = 0

            while True:
                rlist, wlist, _ = select(
                    filter_fds([h264_in_fd, rawaudio_in_fd]),
                    filter_fds([h264_out_fd, rawaudio_out_fd]),
                    [],
                )

                if h264_in_fd in rlist:
                    h264_buffer.extend(os.read(h264_in_fd.fileno(), READ_MAX_SIZE))

                if h264_out_fd in wlist and len(h264_buffer) > H264_NALU_HEADER_SIZE:
                    flush_to = h264_buffer.rfind(
                        H264_NALU_HEADER,
                        H264_NALU_HEADER_SIZE,
                    )
                    if flush_to == -1:
                        flush_to = len(h264_buffer) - H264_NALU_HEADER_SIZE
                    flush_to = min(flush_to, PIPE_BUF)
                    os.write(h264_out_fd.fileno(), h264_buffer[:flush_to])
                    del h264_buffer[:flush_to]

                if rawaudio_in_fd in rlist:
                    rawaudio_buffer.extend(
                        os.read(rawaudio_in_fd.fileno(), READ_MAX_SIZE)
                    )

                if rawaudio_out_fd in wlist and len(rawaudio_buffer) > 0:
                    flush_to = (
                        len(rawaudio_buffer)
                        // RAWAUDIO_SAMPLE_SIZE
                        * RAWAUDIO_SAMPLE_SIZE
                    )

                    elapsed_time = timezone.now() - start_date
                    rawaudio_limit = int(elapsed_time.total_seconds() * rawaudio_bps)
                    flush_to = min(max(0, rawaudio_limit - rawaudio_sent), flush_to)

                    os.write(rawaudio_out_fd.fileno(), rawaudio_buffer[:flush_to])
                    del rawaudio_buffer[:flush_to]

                    rawaudio_sent += flush_to

                if (
                    h264_buffer[:H264_NALU_HEADER_SIZE] == H264_NALU_HEADER
                    and timezone.now() > next_split
                ):
                    print(f"Split point reached:       {timezone.now() - start_date}")
                    print(f"Video remaining in buffer: {len(h264_buffer)} bytes")
                    print(f"Audio remaining in buffer: {len(rawaudio_buffer)} bytes")
                    print(f"{' '*27}{len(rawaudio_buffer)/rawaudio_bps} seconds")
                    break

            current_date = timezone.now()

            h264_out_fd.close()
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

    h264_in_fd.close()
    h264_out_fd.close()

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
