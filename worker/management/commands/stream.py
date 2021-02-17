from django.core.management.base import BaseCommand, CommandError
from camera.models import Camera


class Command(BaseCommand):
    help = 'Starts streaming the specified camera'

    def add_arguments(self, parser):
        parser.add_argument('camera_id', type=int)

    def handle(self, *args, **options):
        try:
            camera = Camera.objects.get(pk=options['camera_id'])
        except Camera.DoesNotExist:
            raise CommandError('Camera "%s" does not exist' % options['camera_id'])

        print(f"{camera.name} ({camera.camera_type})")
        streams = camera.camera_type.streams
        for stream in streams.all():
            print(f"- {stream.name}: {stream.protocol}://{camera.username}:{camera.password}@{camera.host}:{stream.port}{stream.url}")
