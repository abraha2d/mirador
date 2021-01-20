from django.db import models

from detection import models as detection
from overlay import models as overlay


class PTZSettings(models.Model):
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


class CameraType(models.Model):
    name = models.CharField(max_length=255)
    # streams is one-to-many to Stream
    ptz_settings = models.ForeignKey(PTZSettings, on_delete=models.RESTRICT)


class Stream(models.Model):
    enabled = models.BooleanField()
    name = models.CharField(max_length=255)
    protocol = models.CharField(max_length=4)
    port = models.PositiveSmallIntegerField()
    url = models.CharField(max_length=255)

    camera_type = models.ForeignKey(CameraType, on_delete=models.CASCADE, related_name="streams")


class Camera(models.Model):
    enabled = models.BooleanField()
    name = models.CharField(max_length=255)
    camera_type = models.ForeignKey(CameraType, on_delete=models.RESTRICT)
    host = models.CharField(max_length=255)
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)

    overlays = models.ManyToManyField(overlay.Overlay)

    sound_detection_settings = models.ForeignKey(detection.SoundDetectionSettings, null=True, blank=True, on_delete=models.SET_NULL)
    motion_detection_settings = models.ForeignKey(detection.MotionDetectionSettings, null=True, blank=True, on_delete=models.SET_NULL)
    require_motion_to_detect = models.BooleanField()
    object_detection_settings = models.ForeignKey(detection.ObjectDetectionSettings, null=True, blank=True, on_delete=models.SET_NULL)
    face_detection_settings = models.ForeignKey(detection.FaceDetectionSettings, null=True, blank=True, on_delete=models.SET_NULL)
    alpr_settings = models.ForeignKey(detection.ALPRSettings, null=True, blank=True, on_delete=models.SET_NULL)
