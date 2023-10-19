from sys import stderr

import ffmpeg
from camera.models import Camera
from django.core.management import CommandError
from os import mkfifo
from os.path import join
from tempfile import mkdtemp
from worker.management.commands.constants import (
    CODEC_EXT_MAP,
    CODEC_H264,
    CODEC_HEVC,
    FF_GLOBAL_ARGS,
    FF_GLOBAL_PARAMS,
    FF_RTSP_DEFAULT_PARAMS,
)


def get_detection_settings(camera: Camera, settings_type: str, detection: bool = True):
    settings_infix = "detection" if detection else ""
    settings_attr = f"{settings_type}{settings_infix}settings"
    if hasattr(camera, settings_attr):
        ds = getattr(camera, settings_attr)
        return ds.enabled, ds.visualize
    else:
        return False, False


def get_feature_config(camera: Camera):
    md_enable, md_visualize = get_detection_settings(camera, "motion")
    od_enable, od_visualize = get_detection_settings(camera, "object")
    fd_enable, fd_visualize = get_detection_settings(camera, "face")
    ld_enable, ld_visualize = get_detection_settings(camera, "alpr", False)

    drawtext_enabled = True if camera.overlays.count() > 0 else False
    drawbox_enabled = md_visualize or od_visualize or fd_visualize or ld_visualize
    detect_enabled = drawbox_enabled or md_enable or od_enable or fd_enable or ld_enable

    return detect_enabled, drawbox_enabled, drawtext_enabled


def get_ffmpeg_cmds(
    decode_config,
    feature_config,
    hxxx_out_path: str,
    rawaudio_out_path: str,
    rawaudio_params,
    stream_config,
    stream_dir: str,
):
    copy_enabled, decode_width, decode_height = decode_config
    detect_enabled, drawbox_enabled, drawtext_enabled = feature_config
    stream_url, _, _, frame_rate, has_audio, rtsp_params = stream_config
    decode_params, encode_params = get_transcode_params(copy_enabled)

    rawvideo_params = {
        "format": "rawvideo",
        "pix_fmt": "rgb24",
        "s": f"{decode_width}x{decode_height}",
    }

    stream_params = {
        "flags": "+cgop",
        "g": frame_rate,
        "hls_time": 3,
        "hls_list_size": 450,
        "hls_flags": "delete_segments",
    }

    inputs = [
        ffmpeg.input(
            stream_url,
            **decode_params,
            **rtsp_params,
        )
    ]
    outputs = [[]]

    if detect_enabled:
        decode_scaled = inputs[0].filter("scale", decode_width, decode_height)
        outputs[0].append(decode_scaled.output("pipe:", **rawvideo_params))

    if drawbox_enabled:
        inputs.append(ffmpeg.input("pipe:", **rawvideo_params))
        outputs.append([])

    if drawtext_enabled:
        drawtext = inputs[-1].drawtext("Hello, world!")
        split = drawtext.filter_multi_output("split")
        splits = [split.stream(0), split.stream(1)]
    else:
        splits = [inputs[-1], inputs[-1]]

    outputs[-1].append(
        splits[0].output(
            f"{stream_dir}/out.m3u8",
            **encode_params,
            **stream_params,
        )
    )

    outputs[-1].append(
        splits[1].output(
            hxxx_out_path,
            **encode_params,
        )
    )

    if has_audio:
        outputs[-1].append(
            splits[1].output(
                rawaudio_out_path,
                **rawaudio_params,
            )
        )

    return [
        ffmpeg.merge_outputs(*output).global_args(*FF_GLOBAL_ARGS).overwrite_output()
        for output in outputs
    ]


def get_frame_rate(video_stream, frame_rate_key: str):
    frame_rate_parts = video_stream[frame_rate_key].split("/")
    return int(frame_rate_parts[0]) / int(frame_rate_parts[1])


def get_hxxx_output(codec: str):
    # return CODEC_HEVC if codec == CODEC_HEVC else CODEC_H264
    return CODEC_H264


def get_stream(probe, codec_type: str):
    return next((s for s in probe["streams"] if s["codec_type"] == codec_type), None)


def get_stream_config(camera: Camera):
    stream_url = camera.urls()[0]

    rtsp_params = {**FF_RTSP_DEFAULT_PARAMS}
    if camera.camera_type.streams.all()[0].force_tcp:
        rtsp_params["rtsp_transport"] = "tcp"

    print(f"{camera.pk}: Probing camera...", flush=True)
    try:
        probe = ffmpeg.probe(
            stream_url,
            **FF_GLOBAL_PARAMS,
            **rtsp_params,
        )
    except ffmpeg.Error as e:
        print(e.stderr.decode(), file=stderr)
        raise CommandError(f"Could not probe camera {camera.pk}")
    print(f"{camera.pk}: Probe completed.")

    video_stream = get_stream(probe, "video")
    if video_stream is None:
        raise CommandError(f"{camera.pk}: No video stream found during probe.")

    codec = video_stream["codec_name"]
    size = int(video_stream["width"]), int(video_stream["height"])
    try:
        frame_rate = get_frame_rate(video_stream, "avg_frame_rate")
    except ZeroDivisionError:
        frame_rate = get_frame_rate(video_stream, "r_frame_rate")

    # TODO: allow disabling audio
    has_audio = get_stream(probe, "audio") is not None
    # has_audio = False

    return stream_url, codec, size, frame_rate, has_audio, rtsp_params


def get_transcode_params(copy_enabled: bool):
    # TODO: actually detect hwaccel
    # TODO: allow disabling hwaccel
    nvdec_available = True
    nvenc_available = True
    vaapi_available = False

    decode_params = {}
    encode_params = {"vcodec": "libx264"}

    if nvdec_available:
        decode_params["hwaccel"] = "cuda"
    elif vaapi_available:
        decode_params["hwaccel"] = "vaapi"

    if copy_enabled:
        encode_params["vcodec"] = "copy"
    elif nvenc_available:
        encode_params["vcodec"] = "h264_nvenc"
    elif vaapi_available:
        encode_params["vcodec"] = "h264_vaapi"

    return decode_params, encode_params


def mkfifotemp(codec: str):
    extension = CODEC_EXT_MAP.get(codec, "raw")
    path = join(mkdtemp(), f"tmp.{extension}")
    mkfifo(path)
    return path
