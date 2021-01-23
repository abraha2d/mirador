from django.contrib import admin
from django.contrib.admin.widgets import FilteredSelectMultiple
from django.forms import ModelForm, PasswordInput

from detection.admin import (
    ALPRSettingsInline,
    FaceDetectionSettingsInline,
    MotionDetectionSettingsInline,
    ObjectDetectionSettingsInline,
    SoundDetectionSettingsInline,
)

from .models import (
    Camera,
    CameraType,
    PTZSettings,
    Stream,
)


class CameraAdminForm(ModelForm):
    class Meta:
        model = Camera
        exclude = []
        widgets = {
            'password': PasswordInput(),
            'overlays': FilteredSelectMultiple(verbose_name='overlays', is_stacked=False),
        }


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    form = CameraAdminForm
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
