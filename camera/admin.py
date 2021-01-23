from django.contrib import admin

from .models import (
    Camera,
    CameraType,
    PTZSettings,
    Stream,
)

from detection.admin import (
    ALPRSettingsInline,
    FaceDetectionSettingsInline,
    MotionDetectionSettingsInline,
    ObjectDetectionSettingsInline,
    SoundDetectionSettingsInline,
)


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    inlines = [
        SoundDetectionSettingsInline,
        MotionDetectionSettingsInline,
        ObjectDetectionSettingsInline,
        FaceDetectionSettingsInline,
        ALPRSettingsInline,
    ]


class StreamInline(admin.TabularInline):
    model = Stream


class PTZSettingsInline(admin.StackedInline):
    model = PTZSettings


@admin.register(CameraType)
class CameraTypeAdmin(admin.ModelAdmin):
    inlines = [
        StreamInline,
        PTZSettingsInline,
    ]
