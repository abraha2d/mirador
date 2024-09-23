from datetime import datetime, timedelta
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import models

from overlay import models as overlay
from pathlib import Path


class CameraType(models.Model):
    name = models.CharField(max_length=255)
    # streams is one-to-many to Stream
    # ptz_settings is one-to-one to PTZSettings

    def __str__(self):
        return self.name


class Stream(models.Model):
    class Protocol(models.TextChoices):
        RTSP = "rtsp", "RTSP"
        HTTP = "http", "HTTP"

    enabled = models.BooleanField()
    name = models.CharField(max_length=255)
    protocol = models.CharField(
        max_length=4, choices=Protocol.choices, default=Protocol.RTSP
    )
    port = models.PositiveSmallIntegerField(default=554)
    url = models.CharField(max_length=255)
    force_tcp = models.BooleanField(default=True)

    camera_type = models.ForeignKey(
        CameraType, on_delete=models.CASCADE, related_name="streams"
    )


class PTZSettings(models.Model):
    class Meta:
        verbose_name = "PTZ settings"
        verbose_name_plural = "PTZ settings"

    enabled = models.BooleanField()

    pan_speed = models.FloatField(null=True, blank=True)
    pan_left_url = models.CharField(max_length=255, null=True, blank=True)
    pan_left_stop_url = models.CharField(max_length=255, null=True, blank=True)
    pan_right_url = models.CharField(max_length=255, null=True, blank=True)
    pan_right_stop_url = models.CharField(max_length=255, null=True, blank=True)

    tilt_speed = models.FloatField(null=True, blank=True)
    tilt_up_url = models.CharField(max_length=255, null=True, blank=True)
    tilt_up_stop_url = models.CharField(max_length=255, null=True, blank=True)
    tilt_down_url = models.CharField(max_length=255, null=True, blank=True)
    tilt_down_stop_url = models.CharField(max_length=255, null=True, blank=True)

    zoom_speed = models.FloatField(null=True, blank=True)
    zoom_in_url = models.CharField(max_length=255, null=True, blank=True)
    zoom_in_stop_url = models.CharField(max_length=255, null=True, blank=True)
    zoom_out_url = models.CharField(max_length=255, null=True, blank=True)
    zoom_out_stop_url = models.CharField(max_length=255, null=True, blank=True)

    camera_type = models.OneToOneField(CameraType, on_delete=models.CASCADE)


class Camera(models.Model):
    enabled = models.BooleanField(default=True)
    name = models.CharField(max_length=255)
    camera_type = models.ForeignKey(CameraType, on_delete=models.RESTRICT)
    host = models.CharField(max_length=255)
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)

    overlays = models.ManyToManyField(overlay.Overlay, blank=True)

    # sound_detection_settings is one-to-one to detection.SoundDetectionSettings
    # motion_detection_settings is one-to-one to detection.MotionDetectionSettings
    # object_detection_settings is one-to-one to detection.ObjectDetectionSettings
    # face_detection_settings is one-to-one to detection.FaceDetectionSettings
    # alpr_settings is one-to-one to detection.ALPRSettings

    # TODO: add "storage_priority" (number, arbitrary scale)

    stream_start = models.DateTimeField(null=True, blank=True)

    def urls(self):
        return [
            f"{stream.protocol.lower()}://{self.username}:{self.password}@{self.host}:{stream.port}{stream.url}"
            for stream in self.camera_type.streams.all()
        ]

    def online(self):
        stream_path = Path(settings.STORAGE_DIR) / f"stream/{self.id}/out.m3u8"
        recently = datetime.now() - timedelta(seconds=30)
        return (
            stream_path.exists()
            and datetime.fromtimestamp(stream_path.stat().st_mtime) > recently
        )

    def video_end(self):
        try:
            latest_video = self.video_set.latest("end_date")
        except ObjectDoesNotExist:
            return None
        return latest_video.end_date

    def __str__(self):
        return self.name
