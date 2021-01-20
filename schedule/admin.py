from django.contrib import admin

from .models import (
    Schedule,
    SchedulePart,
)


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    pass


@admin.register(SchedulePart)
class SchedulePartAdmin(admin.ModelAdmin):
    pass
