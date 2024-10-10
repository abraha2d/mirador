CODEC_H264 = "h264"
CODEC_HEVC = "hevc"
CODEC_RAWAUDIO = "s16le"
AUDIO_RATE = 16000


DECODE_SIZE = 1280, 720

FF_GLOBAL_PARAMS = {
    "hide_banner": None,
    "loglevel": "15",  # Just above "error", well below "fatal"
}

FF_GLOBAL_ARGS = []
for k, v in FF_GLOBAL_PARAMS.items():
    FF_GLOBAL_ARGS.append(f"-{k}")
    if v is not None:
        FF_GLOBAL_ARGS.append(v)

FF_RTSP_DEFAULT_PARAMS = {"stimeout": 5000000}

HXXX_CODECS = ["h264", "hevc"]
HXXX_NALU_HEADER = b"\x00\x00\x00\x01\x67"
HXXX_NALU_HEADER_SIZE = len(HXXX_NALU_HEADER)

RAWAUDIO_SAMPLE_SIZE = 2

READ_MAX_SIZE = 1048576

RECORD_DIR = "record"
RECORD_FILENAME = "VID_%Y%m%d_%H%M%S.mp4"

STAT_CHECK_PERIOD = 5
STALL_PERIOD_MAX = 12

HXXX_OFLOW = 1 * 1024 * 1024 * 5  # 5 seconds of 8Mbps video
RAWAUDIO_OFLOW = 8000 * 2 * 5  # 5 seconds of 44.1kHz audio
OFLOW_PERIOD_MAX = 12

STREAM_DIR = "stream"

YOLO_MODEL = "yolov8n.pt"
