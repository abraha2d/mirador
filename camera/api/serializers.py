from rest_framework import serializers

from .. import models


class CameraSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Camera
        fields = ("id", "enabled", "last_ping", "name")
