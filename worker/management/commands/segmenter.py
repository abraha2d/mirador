from datetime import timedelta
from errno import ENXIO
from select import PIPE_BUF, select
import os
from django.conf import settings
from pathlib import Path
from random import randrange
from subprocess import TimeoutExpired
from traceback import print_exception

from django.utils import timezone
import ffmpeg

from camera.models import Camera
from storage.models import Video
from worker.management.commands.constants import (
    CODEC_RAWAUDIO,
    FF_GLOBAL_ARGS,
    HXXX_NALU_HEADER,
    HXXX_NALU_HEADER_SIZE,
    RAWAUDIO_SAMPLE_SIZE,
    READ_MAX_SIZE,
    STALL_PERIOD_MAX,
    STAT_CHECK_PERIOD,
)
from worker.management.commands.exceptions import StallDetectedError
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
                self._fileno = os.open(self.path, self.flags | os.O_NONBLOCK)
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
    hxxx_in_fd = LazyFD(hxxx_in_path, os.O_RDONLY)
    hxxx_buffer = bytearray()
    hxxx_in_stats, hxxx_out_stats = 0, 0

    rawaudio_in_fd = LazyFD(rawaudio_in_path, os.O_RDONLY)
    rawaudio_buffer = bytearray()
    rawaudio_in_stats, rawaudio_out_stats = 0, 0

    record_params = {
        "movflags": "+faststart",
        "vcodec": "copy",
    }

    current_date = timezone.now()
    record_process = None
    save_process, save_path, save_start, save_end = None, None, None, None
    start_date = None

    try:
        while True:
            start_date = current_date
            next_split = start_date.replace(
                minute=start_date.minute
                // settings.RECORD_SEGMENT_MINS
                * settings.RECORD_SEGMENT_MINS,
                second=randrange(59),
                microsecond=randrange(999999),
            ) + timedelta(minutes=settings.RECORD_SEGMENT_MINS)
            file_path = start_date.strftime(record_path)

            hxxx_out_path = mkfifotemp(hxxx_in_codec)
            hxxx_out_fd = LazyFD(hxxx_out_path, os.O_WRONLY)

            rawaudio_out_path = mkfifotemp(CODEC_RAWAUDIO)
            rawaudio_out_fd = LazyFD(rawaudio_out_path, os.O_WRONLY)

            ffmpeg_input = (
                ffmpeg.input(
                    rawaudio_out_path,
                    **rawaudio_params,
                )
                if has_audio
                else ffmpeg.input(hxxx_out_path)
            )
            audio_hack = {"i": hxxx_out_path} if has_audio else {}

            record_cmd = (
                ffmpeg_input.output(
                    file_path,
                    **audio_hack,  # TODO: this only works because "i" is alphabetically first in the list of params
                    **record_params,
                )
                .global_args(*FF_GLOBAL_ARGS)
                .overwrite_output()
            )
            record_process = record_cmd.run_async()
            print(f"{camera.id}: - Record process PID: {record_process.pid}")

            camera.refresh_from_db()
            camera.last_ping = current_date
            camera.save()

            i = 0
            stat_check = timezone.now()
            stall_periods = 0

            while True:
                i += 1

                if save_process is not None and save_process.poll() is not None:
                    print("   ===  save point ===   ", flush=True)
                    if Path(save_path).is_file():
                        Video.objects.create(
                            camera=camera,
                            start_date=save_start,
                            end_date=save_end,
                            file="/".join(save_path.split("/")[-3:]),
                        )
                    else:
                        print("   ===   no file!  ===   ", flush=True)
                    save_process = None

                _rlist = filter_fds([hxxx_in_fd, rawaudio_in_fd])
                _wlist = filter_fds([hxxx_out_fd, rawaudio_out_fd])
                _xlist = _rlist + _wlist

                rlist, wlist, xlist = select(_rlist, _wlist, _xlist)

                hxxx_in_stats -= len(hxxx_buffer)

                if hxxx_in_fd in rlist and hxxx_in_fd not in xlist:
                    hxxx_buffer.extend(os.read(hxxx_in_fd.fileno(), READ_MAX_SIZE))

                hxxx_in_stats += len(hxxx_buffer)
                hxxx_out_stats += len(hxxx_buffer)

                if (
                    hxxx_out_fd in wlist
                    and hxxx_out_fd not in xlist
                    and len(hxxx_buffer) > HXXX_NALU_HEADER_SIZE
                ):
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

                if rawaudio_in_fd in rlist and rawaudio_in_fd not in xlist:
                    rawaudio_buffer.extend(
                        os.read(rawaudio_in_fd.fileno(), READ_MAX_SIZE)
                    )

                rawaudio_in_stats += len(rawaudio_buffer)
                rawaudio_out_stats += len(rawaudio_buffer)

                if (
                    rawaudio_out_fd in wlist
                    and rawaudio_out_fd not in xlist
                    and len(rawaudio_buffer) > 0
                ):
                    flush_to = (
                        len(rawaudio_buffer)
                        // RAWAUDIO_SAMPLE_SIZE
                        * RAWAUDIO_SAMPLE_SIZE
                    )
                    os.write(rawaudio_out_fd.fileno(), rawaudio_buffer[:flush_to])
                    del rawaudio_buffer[:flush_to]

                rawaudio_out_stats -= len(rawaudio_buffer)

                if timezone.now() > stat_check:
                    print(
                        f"V + {hxxx_in_stats:7} - {hxxx_out_stats:7} = {len(hxxx_buffer):8}  "
                        f"A + {rawaudio_in_stats:7} - {rawaudio_out_stats:7} = {len(rawaudio_buffer):8}  "
                        f"I = {i:6}  S = {save_process is not None}",
                        flush=True,
                    )

                    if hxxx_in_stats == 0 or hxxx_out_stats == 0:
                        stall_periods += 1
                    else:
                        stall_periods = 0

                    hxxx_in_stats, hxxx_out_stats = 0, 0
                    rawaudio_in_stats, rawaudio_out_stats = 0, 0

                    i = 0
                    stat_check = timezone.now() + timedelta(seconds=STAT_CHECK_PERIOD)

                if (
                    hxxx_buffer[:HXXX_NALU_HEADER_SIZE] == HXXX_NALU_HEADER
                    and timezone.now() > next_split
                    and hxxx_out_stats > 0
                ):
                    print("   === split point ===   ", flush=True)
                    break

                if stall_periods > STALL_PERIOD_MAX:
                    print("   =  stall detected =   ", flush=True)
                    raise StallDetectedError()

            current_date = timezone.now()

            hxxx_out_fd.close()
            rawaudio_out_fd.close()
            record_process.terminate()

            save_process, save_path = record_process, file_path
            save_start, save_end = start_date, current_date

    except BrokenPipeError as e:
        print_exception(e)
        pass

    except KeyboardInterrupt as e:
        print_exception(e)
        pass

    except StallDetectedError:
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
        if Path(file_path).is_file():
            Video.objects.create(
                camera=camera,
                start_date=start_date,
                end_date=timezone.now(),
                file="/".join(file_path.split("/")[-3:]),
            )
