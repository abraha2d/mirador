from rest_framework import serializers

from .. import models


class CameraSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Camera
        fields = '__all__'
