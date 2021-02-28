from rest_framework import permissions, viewsets

from .. import models
from . import serializers


class VideoViewSet(viewsets.ModelViewSet):
    queryset = models.Video.objects.all()
    serializer_class = serializers.VideoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        camera__id = self.request.GET.get("camera__id", None)
        if camera__id is not None:
            queryset = queryset.filter(camera__id=camera__id)
        return queryset
