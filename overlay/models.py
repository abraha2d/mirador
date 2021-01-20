from django.db import models

from colorfield.fields import ColorField


class Overlay(models.Model):
    enabled = models.BooleanField()
    format = models.CharField(max_length=255)
    x_pos = models.PositiveSmallIntegerField()
    y_pos = models.PositiveSmallIntegerField()
    color = ColorField(format='hexa')
