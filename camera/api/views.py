from rest_framework import permissions, viewsets

from .. import models
from . import serializers


class CameraViewSet(viewsets.ModelViewSet):
    queryset = models.Camera.objects.all()
    serializer_class = serializers.CameraSerializer
    permission_classes = [permissions.IsAuthenticated]
