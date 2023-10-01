DECODE_SIZE = 1280, 720

FF_GLOBAL_PARAMS = {
    "hide_banner": None,
    "loglevel": "error",
}

FF_GLOBAL_ARGS = []
for k, v in FF_GLOBAL_PARAMS.items():
    FF_GLOBAL_ARGS.append(f"-{k}")
    if v is not None:
        FF_GLOBAL_ARGS.append(v)

FF_RTSP_DEFAULT_PARAMS = {"stimeout": 5000000}

H264_CODEC = "h264"
H264_EXT = "h264"
H264_NALU_HEADER = b"\x00\x00\x01\x67"
H264_NALU_HEADER_SIZE = len(H264_NALU_HEADER)

RAWAUDIO_CODEC = "s16le"
RAWAUDIO_EXT = "s16le"
RAWAUDIO_SAMPLE_SIZE = 2

READ_MAX_SIZE = 1048576

RECORD_DIR = "record"
RECORD_FILENAME = "VID_%Y%m%d_%H%M%S.mp4"
RECORD_SEGMENT_MINS = 15

STREAM_DIR = "stream"

YOLO_MODEL = "yolov8n.pt"
