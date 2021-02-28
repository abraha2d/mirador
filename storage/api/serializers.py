from rest_framework import serializers

from .. import models


class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Video
        fields = ("camera", "start_date", "end_date", "file")
