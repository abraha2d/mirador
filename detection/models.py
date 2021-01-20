from django.db import models

from colorfield.fields import ColorField


class SoundDetectionSettings(models.Model):
    enabled = models.BooleanField()
    sensitivity = models.FloatField()
    # schedule is many-to-one to schedule.Schedule


class MotionDetectionSettings(models.Model):
    enabled = models.BooleanField()
    sensitivity = models.FloatField()
    # schedule is many-to-one to schedule.Schedule
    # regions is one-to-many to MotionDetectionRegion


class MotionDetectionRegion(models.Model):
    enabled = models.BooleanField()
    color = ColorField(format='hexa')
    points = models.JSONField()

    motion_detection_settings = models.ForeignKey(MotionDetectionSettings, on_delete=models.CASCADE, related_name="regions")


class ObjectDetectionSettings(models.Model):
    enabled = models.BooleanField()
    threshold = models.FloatField()


class FaceDetectionSettings(models.Model):
    enabled = models.BooleanField()


class ALPRSettings(models.Model):
    enabled = models.BooleanField()
