from django.contrib import admin

from .models import (
    Event,
    Picture,
    Video,
)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    pass


@admin.register(Picture)
class PictureAdmin(admin.ModelAdmin):
    pass


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("camera", "start_date", "end_date", "file")
    list_filter = ("camera",)
    ordering = ("-start_date",)
