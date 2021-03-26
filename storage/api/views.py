from datetime import timedelta, datetime
from dateutil.relativedelta import relativedelta
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .. import models
from . import serializers


class VideoViewSet(viewsets.ModelViewSet):
    queryset = models.Video.objects.all()
    serializer_class = serializers.VideoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        month = self.request.GET.get("month", None)
        if month is not None:
            month = datetime.strptime(month, "%m/%d/%Y").replace(day=1)
            queryset = queryset.filter(
                start_date__gte=month, start_date__lt=month + relativedelta(months=1)
            )

        date = self.request.GET.get("date", None)
        if date is not None:
            date = datetime.strptime(date, "%m/%d/%Y")
            queryset = queryset.filter(
                start_date__gte=date - timedelta(days=2),
                start_date__lt=date + timedelta(days=3),
            ) | queryset.filter(
                end_date__gte=date - timedelta(days=2),
                end_date__lt=date + timedelta(days=3),
            )

        camera_ids = self.request.GET.getlist("camera_id")
        if camera_ids:
            queryset = queryset.filter(camera_id__in=camera_ids)

        return queryset

    @action(methods=["get"], detail=False)
    def dates(self, request):
        queryset = self.get_queryset()
        dates = {
            dt.date().strftime("%-m/%-d/%Y")
            for dt in queryset.values_list("start_date", flat=True)
        }
        try:
            dates.add(queryset.last().end_date.date().strftime("%-m/%-d/%Y"))
        except AttributeError:
            pass
        return Response(dates)
