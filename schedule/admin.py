from django.contrib import admin

from .models import (
    Schedule,
    SchedulePart,
)


class SchedulePartInline(admin.TabularInline):
    model = SchedulePart


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    inlines = [
        SchedulePartInline,
    ]
