from datetime import datetime, timedelta
import json
from pytz import UTC
from urllib.parse import parse_qs, urlparse

from django.conf import settings
from django.http import HttpResponse
from oauth2_provider.views.generic import ProtectedResourceView
import jwt

from camera.models import Camera

JWT_ALG = "HS256"


def encode_jwt(aud: str, exp_delta: timedelta = timedelta(days=1)) -> str:
    now = datetime.now(tz=UTC)
    payload = {
        "aud": aud,
        "exp": now + exp_delta,
        "nbf": now,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALG)


def proxy_auth(request):
    original_url = urlparse(request.headers["X-Original-URI"])

    aud = original_url.path
    token = parse_qs(original_url.query).get("token", [""])[0]

    if aud[-3:] == ".ts":
        # .ts files will be encrypted by ffmpeg
        return HttpResponse(status=204)

    try:
        jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[JWT_ALG],
            audience=original_url.path,
            leeway=timedelta(seconds=10),
            options={"require": ["aud", "exp", "nbf"]},
        )
        return HttpResponse(status=204)
    except (
        jwt.ExpiredSignatureError,
        jwt.ImmatureSignatureError,
        jwt.InvalidSignatureError,
        jwt.InvalidAudienceError,
        jwt.MissingRequiredClaimError,
    ) as e:
        return HttpResponse(status=403, headers={"WWW-Authenticate": e})
    except (jwt.DecodeError,) as e:
        return HttpResponse(status=401, headers={"WWW-Authenticate": e})


def execute_get_camera_stream(request, device_id, params):
    try:
        camera = Camera.objects.get(pk=device_id)
    except (Camera.DoesNotExist, Camera.MultipleObjectsReturned):
        return {
            "status": "ERROR",
            "errorCode": "unableToLocateDevice",
        }

    online = camera.last_ping and (
        (datetime.now(UTC) - camera.last_ping) < timedelta(minutes=16)
    )

    stream_host = "https://mirador.westhousefarm.com"  # TODO: don't hardcode this
    stream_path = f"/stream/{camera.id}/out.m3u8"
    stream_jwt = encode_jwt(stream_path)
    stream_url = f"{stream_host}{stream_path}?token={stream_jwt}"

    return {
        "status": "SUCCESS" if online else "OFFLINE",
        "states": {
            "online": online,
            "cameraStreamProtocol": "hls",
            "cameraStreamAccessUrl": stream_url,
        },
    }


COMMAND_MAP = {"action.devices.commands.GetCameraStream": execute_get_camera_stream}


def handle_execute(request, payload):
    resp = []

    for command_set in payload["commands"]:
        devices = command_set["devices"]

        for execute in command_set["execution"]:
            command = execute["command"]
            params = execute.get("params", {})

            handler = COMMAND_MAP.get(command, None)
            if handler is not None:
                for device in devices:
                    device_id = device["id"]
                    resp.append(
                        {
                            "ids": [device_id],
                            **handler(request, device_id, params),
                        }
                    )

    # TODO: condense command responses

    return {"commands": resp}


def handle_sync(request, payload):
    return {
        "agentUserId": request.user.id,
        "devices": [
            {
                "id": c.id,
                "type": "action.devices.types.CAMERA",
                "traits": [
                    "action.devices.traits.CameraStream",
                ],
                "name": {
                    "name": c.name,
                },
                "willReportState": False,
                "attributes": {
                    "cameraStreamSupportedProtocols": [
                        "hls",
                    ],
                    "cameraStreamNeedAuthToken": False,
                },
            }
            for c in Camera.objects.all()
        ],
    }


def handle_query(request, payload):
    resp = {}

    for device in payload["devices"]:
        device_id = device["id"]
        try:
            camera = Camera.objects.get(pk=device_id)
        except (Camera.DoesNotExist, Camera.MultipleObjectsReturned):
            resp[device_id] = {
                "online": False,
                "status": "ERROR",
                "errorCode": "unableToLocateDevice",
            }
            continue

        online = bool(camera.last_ping) and (
            (datetime.now(UTC) - camera.last_ping) < timedelta(minutes=16)
        )
        resp[device_id] = {
            "online": online,
            "status": "SUCCESS" if online else "OFFLINE",
        }

    return {"devices": resp}


INTENT_MAP = {
    "action.devices.SYNC": handle_sync,
    "action.devices.QUERY": handle_query,
    "action.devices.EXECUTE": handle_execute,
}


class Fulfillment(ProtectedResourceView):
    def post(self, request, *args, **kwargs):
        req = json.loads(request.body)
        resp = {
            "requestId": req["requestId"],
        }

        print(f"Request: {req}")

        for req_input in req["inputs"]:
            intent = req_input["intent"]
            payload = req_input.get("payload", None)

            handler = INTENT_MAP.get(intent, None)
            if handler is not None:
                resp["payload"] = handler(request, payload)

        print(f"Response: {resp}")

        print("Done.", flush=True)
        return HttpResponse(json.dumps(resp))
