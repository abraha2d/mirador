from datetime import timedelta
from errno import ENXIO
from io import FileIO
import os
from pathlib import Path
from random import randrange
from select import select
from subprocess import TimeoutExpired
from time import perf_counter
from traceback import print_exception

from django.conf import settings
from django.utils import timezone
import ffmpeg

from camera.models import Camera
from storage.models import Video
from worker.management.commands.constants import (
    AUDIO_RATE,
    CODEC_RAWAUDIO,
    FF_GLOBAL_ARGS,
    HXXX_NALU_HEADER,
    HXXX_NALU_HEADER_SIZE,
    HXXX_OFLOW,
    OFLOW_PERIOD_MAX,
    RAWAUDIO_OFLOW,
    RAWAUDIO_SAMPLE_SIZE,
    READ_MAX_SIZE,
    STALL_PERIOD_MAX,
    STAT_CHECK_PERIOD,
)
from worker.management.commands.exceptions import OflowDetectedError, StallDetectedError
from worker.management.commands.utils import mkfifotemp


class LazyFD:
    def __init__(self, path: str, flags: int, mode: str):
        self.path = path
        self.flags = flags
        self.mode = mode
        self._fileio: FileIO | None = None

    def close(self):
        if self._fileio is not None:
            self._fileio.close()
            self._fileio = None

    def fileno(self):
        if self._fileio is None:
            try:
                self._fileio = FileIO(
                    os.open(self.path, self.flags | os.O_NONBLOCK),
                    self.mode,
                )
                os.set_blocking(self._fileio.fileno(), False)
            except OSError as e:
                if e.errno != ENXIO:
                    raise e
        return self._fileio and self._fileio.fileno()


def filter_fds(fds: list[LazyFD]):
    return [fd for fd in fds if fd.fileno() is not None]


def segment_hxxx(
    camera: Camera,
    frame_rate: float,
    record_path: str,
    hxxx_in_codec: str,
    hxxx_in_path: str,
    has_audio: bool,
    rawaudio_in_path: str,
    rawaudio_params,
):
    read_buffer = bytearray(READ_MAX_SIZE)
    read_buffer_view = memoryview(read_buffer)

    hxxx_in_fd = LazyFD(hxxx_in_path, os.O_RDONLY, "r")
    hxxx_buffer = bytearray()
    hxxx_in_stats, hxxx_out_stats = 0, 0

    rawaudio_in_fd = LazyFD(rawaudio_in_path, os.O_RDONLY, "r")
    rawaudio_buffer = bytearray()
    rawaudio_in_stats, rawaudio_out_stats = 0, 0

    record_params = {
        "movflags": "+faststart",
        "vcodec": "copy",
        "ar": AUDIO_RATE,
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
            hxxx_out_fd = LazyFD(hxxx_out_path, os.O_WRONLY, "w")

            rawaudio_out_path = mkfifotemp(CODEC_RAWAUDIO)
            rawaudio_out_fd = LazyFD(rawaudio_out_path, os.O_WRONLY, "w")

            ffmpeg_inputs = [
                ffmpeg.input(
                    hxxx_out_path,
                    framerate=frame_rate,
                    thread_queue_size=4194304,
                )
            ]
            if has_audio:
                ffmpeg_inputs.append(
                    ffmpeg.input(
                        rawaudio_out_path,
                        **rawaudio_params,
                        thread_queue_size=262144,
                    )
                )

            record_cmd = (
                ffmpeg.output(
                    *ffmpeg_inputs,
                    file_path,
                    **record_params,
                )
                .global_args(*FF_GLOBAL_ARGS)
                .overwrite_output()
            )
            record_process = record_cmd.run_async()
            print(f"{camera.id}: - Record process PID: {record_process.pid}")

            i = 0
            stat_check = perf_counter()
            stall_periods = 0
            oflow_periods = 0

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

                should_split = timezone.now() > next_split

                _rlist = filter_fds([hxxx_in_fd, rawaudio_in_fd])

                _wlist = []
                if len(hxxx_buffer):
                    _wlist.append(hxxx_out_fd)
                if len(rawaudio_buffer):
                    _wlist.append(rawaudio_out_fd)
                _wlist = filter_fds(_wlist)

                rlist, wlist, _ = select(_rlist, _wlist, [], 1)

                if hxxx_in_fd in rlist:
                    num_bytes = hxxx_in_fd._fileio.readinto(read_buffer)
                    hxxx_buffer.extend(read_buffer_view[:num_bytes])
                    hxxx_in_stats += num_bytes

                if hxxx_out_fd in wlist:
                    if should_split:
                        flush_to = hxxx_buffer.rfind(HXXX_NALU_HEADER)
                        if flush_to == -1:
                            flush_to = len(hxxx_buffer) - (HXXX_NALU_HEADER_SIZE - 1)
                    else:
                        flush_to = None

                    num_bytes = hxxx_out_fd._fileio.write(
                        memoryview(hxxx_buffer)[:flush_to]
                    )

                    del hxxx_buffer[:num_bytes]
                    hxxx_out_stats += num_bytes

                if rawaudio_in_fd in rlist:
                    num_bytes = rawaudio_in_fd._fileio.readinto(read_buffer)
                    rawaudio_buffer.extend(read_buffer_view[:num_bytes])
                    rawaudio_in_stats += num_bytes

                if rawaudio_out_fd in wlist:
                    flush_to = (
                        len(rawaudio_buffer)
                        // RAWAUDIO_SAMPLE_SIZE
                        * RAWAUDIO_SAMPLE_SIZE
                    )

                    num_bytes = rawaudio_out_fd._fileio.write(
                        memoryview(rawaudio_buffer)[:flush_to]
                    )

                    del rawaudio_buffer[:num_bytes]
                    rawaudio_out_stats += num_bytes

                if (
                    should_split
                    and hxxx_buffer[:HXXX_NALU_HEADER_SIZE] == HXXX_NALU_HEADER
                ):
                    print("   === split point ===   ", flush=True)
                    break

                if perf_counter() > stat_check:
                    print(
                        f"V + {hxxx_in_stats:7} - {hxxx_out_stats:7} = {len(hxxx_buffer):8}          "
                        f"A + {rawaudio_in_stats:7} - {rawaudio_out_stats:7} = {len(rawaudio_buffer):8}          "
                        f"I = {i:6}     searching = {should_split}     saving = {save_process is not None}",
                        flush=True,
                    )

                    if hxxx_in_stats == 0 or hxxx_out_stats == 0:
                        stall_periods += 1
                    else:
                        stall_periods = 0

                    if (
                        len(hxxx_buffer) > HXXX_OFLOW
                        or len(rawaudio_buffer) > RAWAUDIO_OFLOW
                    ):
                        oflow_periods += 1
                    else:
                        oflow_periods = 0

                    hxxx_in_stats, hxxx_out_stats = 0, 0
                    rawaudio_in_stats, rawaudio_out_stats = 0, 0

                    i = 0
                    stat_check += STAT_CHECK_PERIOD

                if stall_periods > STALL_PERIOD_MAX:
                    print("   =  stall detected =   ", flush=True)
                    raise StallDetectedError()

                if oflow_periods > OFLOW_PERIOD_MAX:
                    print("  =  overflow detected = ", flush=True)
                    raise OflowDetectedError()

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

    except (StallDetectedError, OflowDetectedError):
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
