from django.db import models

from overlay import models as overlay


class CameraType(models.Model):
    name = models.CharField(max_length=255)
    # streams is one-to-many to Stream
    # ptz_settings is one-to-one to PTZSettings

    def __str__(self):
        return self.name


class Stream(models.Model):

    class Protocol(models.TextChoices):
        RTSP = 'RTSP', 'RTSP'
        HTTP = 'HTTP', 'HTTP'

    enabled = models.BooleanField()
    name = models.CharField(max_length=255)
    protocol = models.CharField(max_length=4, choices=Protocol.choices, default=Protocol.RTSP)
    port = models.PositiveSmallIntegerField(default=554)
    url = models.CharField(max_length=255)

    camera_type = models.ForeignKey(CameraType, on_delete=models.CASCADE, related_name="streams")


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

    def __str__(self):
        return self.name
