from django.contrib import admin

from .models import (
    ALPRSettings,
    FaceDetectionSettings,
    MotionDetectionSettings,
    ObjectDetectionSettings,
    SoundDetectionSettings,
)


class ALPRSettingsInline(admin.StackedInline):
    model = ALPRSettings


class FaceDetectionSettingsInline(admin.StackedInline):
    model = FaceDetectionSettings


class MotionDetectionSettingsInline(admin.StackedInline):
    model = MotionDetectionSettings


class ObjectDetectionSettingsInline(admin.StackedInline):
    model = ObjectDetectionSettings


class SoundDetectionSettingsInline(admin.StackedInline):
    model = SoundDetectionSettings
