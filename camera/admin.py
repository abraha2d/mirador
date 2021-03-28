from django.contrib import admin
from django.contrib.admin.widgets import FilteredSelectMultiple
from django.forms import CharField, ModelForm, PasswordInput

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
        exclude = ["last_ping"]
        widgets = {
            "password": PasswordInput(render_value=True),
            "overlays": FilteredSelectMultiple(
                verbose_name="overlays", is_stacked=False
            ),
        }


def make_enabled(modeladmin, request, queryset):
    queryset.update(enabled=True)


make_enabled.short_description = "Enable selected cameras"


def make_disabled(modeladmin, request, queryset):
    queryset.update(enabled=False)


make_disabled.short_description = "Disable selected cameras"


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ("name", "host", "camera_type", "enabled")
    ordering = ("name",)
    actions = [make_enabled, make_disabled]

    form = CameraAdminForm
    inlines = [
        SoundDetectionSettingsInline,
        MotionDetectionSettingsInline,
        ObjectDetectionSettingsInline,
        FaceDetectionSettingsInline,
        ALPRSettingsInline,
    ]
    save_as = True
    save_on_top = True


class StreamInline(admin.TabularInline):
    model = Stream


class PTZSettingsInline(admin.StackedInline):
    model = PTZSettings


@admin.register(CameraType)
class CameraTypeAdmin(admin.ModelAdmin):
    ordering = ("name",)

    inlines = [
        StreamInline,
        PTZSettingsInline,
    ]
    save_as = True
    save_on_top = True
