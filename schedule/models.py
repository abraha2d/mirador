from django.db import models


class Schedule(models.Model):
    name = models.CharField(max_length=255)
    # parts is one-to-many to SchedulePart
    invert = models.BooleanField()


class SchedulePart(models.Model):
    enabled = models.BooleanField()

    sunday = models.BooleanField()
    monday = models.BooleanField()
    tuesday = models.BooleanField()
    wednesday = models.BooleanField()
    thursday = models.BooleanField()
    friday = models.BooleanField()
    saturday = models.BooleanField()

    start_time = models.TimeField()
    end_time = models.TimeField()

    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name="parts")
