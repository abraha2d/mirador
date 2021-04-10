from datetime import timedelta
from multiprocessing import Process
from os import kill, mkfifo, makedirs
from os.path import join
from shutil import disk_usage
from signal import SIGINT
from tempfile import mkdtemp
from time import sleep

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from humanize import naturalsize
import ffmpeg
import numpy as np

from camera.models import Camera
from storage.models import Video


def check_storage(path, min_percent, min_bytes):
    total, used, free = disk_usage(path)
    if free < min_bytes:
        print(
            f"{path}: Free space ({naturalsize(free)}) less than {naturalsize(min_bytes)}."
        )
        return False
    if free / total * 100 < min_percent:
        print(
            f"{path}: Free space ({naturalsize(free)}) less than {min_percent}% of {naturalsize(total)}."
        )
        return False
    return True


def handle_housekeep():
    record_dir = f"{settings.STORAGE_DIR}/record/"
    storage_ok = check_storage(
        record_dir, settings.MIN_FREE_PERCENT, settings.MIN_FREE_BYTES
    )
    if not storage_ok:
        print("Calling WALL-E...")


class Command(BaseCommand):
    help = "Does housekeeping tasks"

    def add_arguments(self, parser):
        parser.add_argument("--oneshot", action="store_true")

    def handle(self, *args, **options):
        first_run = True
        while first_run or options.get("oneshot", False):
            if not first_run:
                sleep(60)
            handle_housekeep()
            first_run = False
