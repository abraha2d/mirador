from datetime import datetime, timedelta
from glob import glob
from os import chdir, remove
from os.path import join, getsize, exists
from shutil import disk_usage
from time import sleep

from django.conf import settings
from django.core.management.base import BaseCommand

import ffmpeg
from humanize import naturalsize
import pandas as pd
from pytz import UTC

from camera.models import Camera
from storage.models import Video


def check_storage(path, min_percent, min_bytes):
    print(
        f"{datetime.now()}: Checking available storage space on {path} ...",
        end="",
        flush=True,
    )
    total, used, free = disk_usage(path)
    min_percent_bytes = total * min_percent / 100
    if free < min_bytes:
        print(f"not good! {naturalsize(free)} < {naturalsize(min_bytes)}")
        return min_bytes - free
    if free < min_percent_bytes:
        print(
            f"not good! {naturalsize(free)} < {naturalsize(min_percent_bytes)} ({min_percent}% of {naturalsize(total)})"
        )
        return min_percent_bytes - free
    print("good.")
    return 0


def delete_old_videos(bytes_to_free):
    print(
        f"{datetime.now()}: Deleting old videos to free up {naturalsize(bytes_to_free)} of space ...",
        end="",
        flush=True,
    )

    video_fields = ["id", "camera_id", "start_date", "end_date", "file"]
    video_qs = Video.objects.order_by("camera_id", "start_date")
    video_values = video_qs.values_list(*video_fields)

    video_df = pd.DataFrame.from_records(video_values, columns=video_fields)
    video_df = video_df.set_index("id")

    chdir(settings.STORAGE_DIR)
    video_df["size"] = video_df["file"].apply(
        lambda vf: getsize(vf) if exists(vf) else 0
    )
    video_df = video_df[video_df["size"] != 0]

    # TODO: Update to pull actual priorities once added to model
    camera_fields = ["camera_id", "priority"]
    camera_qs = Camera.objects.all()
    camera_values = [(i, 1) for i, enabled in camera_qs.values_list("id", "enabled")]

    camera_df = pd.DataFrame.from_records(camera_values, columns=camera_fields)
    camera_df = camera_df.set_index("camera_id")

    camera_df["videocount"] = video_df.groupby("camera_id").size()
    camera_df = camera_df.fillna({"videocount": 0}).astype("int")
    camera_df["vc_norm"] = camera_df["videocount"] / camera_df["priority"]

    videos_to_delete = set()
    files_to_delete = []
    bytes_freed = 0
    while bytes_freed < bytes_to_free:
        camera_id = camera_df["vc_norm"].idxmax()
        video_row = video_df[video_df["camera_id"] == camera_id].iloc[0]
        video_id = video_row.name

        videos_to_delete.add(video_id)
        files_to_delete.append(video_row["file"])
        bytes_freed += video_row["size"]

        video_df.drop(video_id, inplace=True)
        camera_df.at[camera_id, "vc_norm"] -= 1 / camera_df.at[camera_id, "priority"]

    chdir(settings.STORAGE_DIR)
    for f in files_to_delete:
        remove(f)
    Video.objects.filter(id__in=videos_to_delete).delete()

    print(f"deleted {len(videos_to_delete)} videos ({naturalsize(bytes_freed)})")


def add_missing_db_records():
    print(
        f"{datetime.now()}: Checking for missing video database entries ...",
        end="",
        flush=True,
    )

    records_to_create = []
    skipped = []

    chdir(settings.STORAGE_DIR)
    for video_path in glob("record/**/*.mp4", recursive=True):
        if not Video.objects.filter(file=video_path).exists():
            path_parts = video_path.split("/")
            camera_id = path_parts[-2]
            start_date = datetime.strptime(
                "_".join(path_parts[-1].split(".")[0].split("_")[-2:]),
                "%Y%m%d_%H%M%S",
            ).replace(tzinfo=UTC)

            try:
                duration = float(ffmpeg.probe(video_path)["format"]["duration"])
            except ffmpeg.Error:
                skipped.append(video_path)
                continue
            end_date = start_date + timedelta(seconds=duration)

            records_to_create.append(
                Video(
                    camera_id=camera_id,
                    start_date=start_date,
                    end_date=end_date,
                    file=video_path,
                )
            )

    Video.objects.bulk_create(records_to_create)

    if len(records_to_create):
        print(f"created {len(records_to_create)} entries.")
    else:
        print("none.")

    if len(skipped):
        print(f"WARN: Skipped {len(skipped)} broken videos:")
        for video_path in skipped:
            print(f"- {video_path}")


def delete_stale_db_records():
    print(
        f"{datetime.now()}: Checking for stale video database entries ...",
        end="",
        flush=True,
    )
    records_to_delete = {
        v.id
        for v in Video.objects.all()
        if not exists(join(settings.STORAGE_DIR, v.file))
    }
    Video.objects.filter(id__in=records_to_delete).delete()
    if len(records_to_delete):
        print(f"deleted {len(records_to_delete)} entries.")
    else:
        print("none.")


def handle_housekeep(do_db_cleanup=True):
    if do_db_cleanup:
        add_missing_db_records()
        delete_stale_db_records()

    record_dir = f"{settings.STORAGE_DIR}/record/"
    bytes_to_free = check_storage(
        record_dir, settings.MIN_FREE_PERCENT, settings.MIN_FREE_BYTES
    )
    if bytes_to_free:
        delete_old_videos(bytes_to_free)


class Command(BaseCommand):
    help = "Does housekeeping tasks"

    def add_arguments(self, parser):
        parser.add_argument("--oneshot", action="store_true")

    def handle(self, *args, **options):
        run_counter = 0
        while run_counter == 0 or not options.get("oneshot", False):
            if run_counter > 0:
                print(
                    f"{datetime.now()}: Sleeping for 60 secs ...",
                    end="",
                    flush=True,
                )
                sleep(60)
                print("done.")
            handle_housekeep(run_counter <= 1)
            run_counter += 1
            if run_counter > 60:
                run_counter = 1
