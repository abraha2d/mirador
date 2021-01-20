from django.contrib import admin

from .models import (
    Camera,
    CameraType,
    PTZSettings,
    Stream,
)


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    pass


@admin.register(CameraType)
class CameraTypeAdmin(admin.ModelAdmin):
    pass


@admin.register(PTZSettings)
class PTZSettingsAdmin(admin.ModelAdmin):
    pass


@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    pass
