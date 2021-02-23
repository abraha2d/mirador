import ffmpeg
import os
import sys

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand, CommandError

from camera.models import Camera


class Command(BaseCommand):
    help = 'Starts streaming the specified camera'

    def add_arguments(self, parser):
        parser.add_argument('camera_id', type=int)

    def handle(self, *args, **options):
        print("Fetching camera details...")
        try:
            camera = Camera.objects.get(pk=options['camera_id'])
        except Camera.DoesNotExist:
            raise CommandError('Camera "%s" does not exist' % options['camera_id'])

        if not camera.enabled:
            print(f"'{camera.name}' is disabled, exiting...")
            sys.exit(1)

        stream_url = camera.urls()[0]

        print("Probing camera...")
        print(stream_url)
        try:
            probe = ffmpeg.probe(stream_url)
        except ffmpeg.Error as e:
            print(e.stderr.decode("utf-8"), file=sys.stderr)
            sys.exit(1)

        video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
        if video_stream is None:
            print('No video stream found', file=sys.stderr)
            sys.exit(1)

        codec_name = video_stream['codec_name']
        width = int(video_stream['width'])
        height = int(video_stream['height'])
        r_frame_rate_parts = video_stream['r_frame_rate'].split('/')
        r_frame_rate = int(r_frame_rate_parts[0]) / int(r_frame_rate_parts[1])

        print("Preparing to start stream...")

        stream_dir = f"{settings.STATICFILES_DIRS[0]}/stream/{camera.id}"
        record_dir = f"{settings.STATICFILES_DIRS[0]}/record/{camera.id}"
        os.makedirs(stream_dir, exist_ok=True)
        os.makedirs(record_dir, exist_ok=True)

        try:
            md_enabled = camera.motiondetectionsettings.enabled
            md_visualize = camera.motiondetectionsettings.visualize
        except ObjectDoesNotExist:
            md_enabled = False
            md_visualize = False

        try:
            od_enabled = camera.objectdetectionsettings.enabled
            od_visualize = camera.objectdetectionsettings.visualize
        except ObjectDoesNotExist:
            od_enabled = False
            od_visualize = False

        try:
            fd_enabled = camera.facedetectionsettings.enabled
            fd_visualize = camera.facedetectionsettings.visualize
        except ObjectDoesNotExist:
            fd_enabled = False
            fd_visualize = False

        try:
            ld_enabled = camera.alprsettings.enabled
            ld_visualize = camera.alprsettings.visualize
        except ObjectDoesNotExist:
            ld_enabled = False
            ld_visualize = False

        drawtext_enabled = True if camera.overlays.count() > 0 else False
        drawbox_enabled = md_visualize or od_visualize or fd_visualize or ld_visualize
        detect_enabled = drawbox_enabled or md_enabled or od_enabled or fd_enabled or ld_enabled

        decode_enabled = detect_enabled
        overlay_enabled = drawtext_enabled and drawbox_enabled
        encode_enabled = drawtext_enabled or drawbox_enabled
        transcode_enabled = not encode_enabled
        copy_enabled = transcode_enabled and (codec_name == 'h264' or codec_name == 'hevc')

        # TODO: Add appropriate hardware acceleration
        # Intel/AMD:
        #   -hwaccel vaapi -hwaccel_device /dev/dri/renderD128 -hwaccel_output_format vaapi -i <input> -c:v h264_vaapi <output>
        # Nvidia:
        #   -hwaccel cuda -hwaccel_output_format cuda -i <input> -c:v h264_nvenc <output>

        rawvideo_params = {
            "format": "rawvideo",
            "pix_fmt": "rgb24",
            "s": f"{width}x{height}",
        }

        hls_params = {
            "flags": "+cgop",
            "g": r_frame_rate * 2,
            "hls_flags": "delete_segments",
        }

        output = ffmpeg.input(stream_url, rtsp_transport="tcp")
        outputs = []

        if decode_enabled:
            outputs.append(output.output('pipe:', **rawvideo_params))
        if drawtext_enabled:
            drawtext = output.drawtext("Hello, world!")
            output = drawtext
        if drawbox_enabled:
            drawbox = ffmpeg.input('pipe:', **rawvideo_params)
            output = drawbox
        if overlay_enabled:
            output = ffmpeg.overlay(drawtext, drawbox)

        if encode_enabled:
            split = output.filter_multi_output("split")
            inputs = [split.stream(0), split.stream(1)]
        else:
            inputs = [output, output]

        outputs.append(inputs[0].output(
            f'{stream_dir}/out.m3u8',
            vcodec='copy' if copy_enabled else 'h264',
            **hls_params,
        ))
        outputs.append(inputs[1].output(
            f'{record_dir}/out.mp4',
            vcodec='copy' if copy_enabled else 'h264',
        ).overwrite_output())

        main_cmd = ffmpeg.merge_outputs(*outputs)
        print(' '.join(main_cmd.compile()))

        print("Starting stream...")
        main_process = main_cmd.run_async(pipe_stdin=True, pipe_stdout=True)

        try:
            while True:
                if decode_enabled:
                    in_bytes = main_process.stdout.read(width * height * 3)
                    if not in_bytes:
                        break

                    # TODO: Process in_bytes to make in_frame
                    in_frame = in_bytes

                    if detect_enabled:
                        # TODO: Do detection on in_frame
                        pass

                    if drawbox_enabled:
                        # TODO: DO drawbox on in_frame to make out_frame
                        out_frame = in_frame

                        # TODO: Process out_frame to make out_bytes
                        out_bytes = out_frame

                        main_process.write(out_bytes)

        except KeyboardInterrupt:
            print("Exiting...")

        main_process.stdin.close()
        main_process.wait()
