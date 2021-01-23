from django.db import models

from colorfield.fields import ColorField


class Overlay(models.Model):
    enabled = models.BooleanField(default=True)
    format = models.CharField(max_length=255)
    x_pos = models.PositiveSmallIntegerField()
    y_pos = models.PositiveSmallIntegerField()
    foreground = ColorField(format='hexa', default='#FFF')
    background = ColorField(format='hexa', default='#000')
