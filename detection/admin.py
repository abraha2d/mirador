from django.contrib import admin

from .models import (
    ALPRSettings,
    FaceDetectionSettings,
    MotionDetectionSettings,
    ObjectDetectionSettings,
    SoundDetectionSettings,
)


@admin.register(ALPRSettings)
class ALPRSettingsAdmin(admin.ModelAdmin):
    pass


@admin.register(FaceDetectionSettings)
class FaceDetectionSettingsAdmin(admin.ModelAdmin):
    pass


@admin.register(MotionDetectionSettings)
class MotionDetectionSettingsAdmin(admin.ModelAdmin):
    pass


@admin.register(ObjectDetectionSettings)
class ObjectDetectionSettingsAdmin(admin.ModelAdmin):
    pass


@admin.register(SoundDetectionSettings)
class SoundDetectionSettingsAdmin(admin.ModelAdmin):
    pass
