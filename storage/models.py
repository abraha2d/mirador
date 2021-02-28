from django.db import models

from camera import models as camera


class Video(models.Model):
    camera = models.ForeignKey(
        camera.Camera, null=True, blank=True, on_delete=models.SET_NULL
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    file = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.camera} from {self.start_date} to {self.end_date}"


class Picture(models.Model):
    camera = models.ForeignKey(
        camera.Camera, null=True, blank=True, on_delete=models.SET_NULL
    )
    date = models.DateTimeField()
    file = models.CharField(max_length=255)


class Event(models.Model):
    date = models.DateTimeField()
    type = models.CharField(max_length=8)
    video = models.ForeignKey(Video, null=True, blank=True, on_delete=models.SET_NULL)
    picture = models.ForeignKey(
        Picture, null=True, blank=True, on_delete=models.SET_NULL
    )
    data = models.JSONField(null=True, blank=True)
