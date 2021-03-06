from django.db import models

from colorfield.fields import ColorField

from camera import models as camera
from schedule import models as schedule


class SoundDetectionSettings(models.Model):
    class Meta:
        verbose_name_plural = "Sound detection settings"

    enabled = models.BooleanField()
    visualize = models.BooleanField()
    sensitivity = models.FloatField()
    schedule = models.ForeignKey(
        schedule.Schedule, on_delete=models.RESTRICT, null=True, blank=True
    )

    camera = models.OneToOneField(camera.Camera, on_delete=models.CASCADE)


class MotionDetectionSettings(models.Model):
    class Meta:
        verbose_name_plural = "Motion detection settings"

    enabled = models.BooleanField()
    visualize = models.BooleanField()
    sensitivity = models.FloatField()
    schedule = models.ForeignKey(
        schedule.Schedule, on_delete=models.RESTRICT, null=True, blank=True
    )
    # regions is one-to-many to MotionDetectionRegion

    camera = models.OneToOneField(camera.Camera, on_delete=models.CASCADE)


class MotionDetectionRegion(models.Model):
    enabled = models.BooleanField()
    color = ColorField(format="hexa")
    points = models.JSONField()

    motion_detection_settings = models.ForeignKey(
        MotionDetectionSettings, on_delete=models.CASCADE, related_name="regions"
    )


class ObjectDetectionSettings(models.Model):
    class Meta:
        verbose_name_plural = "Object detection settings"

    enabled = models.BooleanField()
    visualize = models.BooleanField()
    threshold = models.FloatField()

    camera = models.OneToOneField(camera.Camera, on_delete=models.CASCADE)


class FaceDetectionSettings(models.Model):
    class Meta:
        verbose_name_plural = "Face detection settings"

    enabled = models.BooleanField()
    visualize = models.BooleanField()

    camera = models.OneToOneField(camera.Camera, on_delete=models.CASCADE)


class ALPRSettings(models.Model):
    class Meta:
        verbose_name = "ALPR settings"
        verbose_name_plural = "ALPR settings"

    enabled = models.BooleanField()
    visualize = models.BooleanField()

    camera = models.OneToOneField(camera.Camera, on_delete=models.CASCADE)
