from django.contrib import admin

from .models import (
    Overlay,
)


@admin.register(Overlay)
class OverlayAdmin(admin.ModelAdmin):
    pass
