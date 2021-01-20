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
    pass
