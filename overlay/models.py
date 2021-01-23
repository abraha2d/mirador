from django.db import models

from colorfield.fields import ColorField


class Overlay(models.Model):
    enabled = models.BooleanField(default=True)
    format = models.CharField(max_length=255)
    x_pos = models.SmallIntegerField()
    y_pos = models.SmallIntegerField()
    foreground = ColorField(format='hexa', default='#FFF')
    background = ColorField(format='hexa', default='#000')

    def __str__(self):
        return f"{self.format} @ ({self.x_pos}, {self.y_pos})"
