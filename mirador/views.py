from datetime import datetime, timedelta
import json
from pytz import UTC

from django.http import HttpResponse
from oauth2_provider.views.generic import ProtectedResourceView

from auth.utils import encode_jwt
from camera.models import Camera


def execute_get_camera_stream(request, device_id, params):
    try:
        camera = Camera.objects.get(pk=device_id)
    except (Camera.DoesNotExist, Camera.MultipleObjectsReturned):
        return {
            "status": "ERROR",
            "errorCode": "unableToLocateDevice",
        }

    stream_host = "https://mirador.westhousefarm.com"  # TODO: don't hardcode this
    stream_path = f"/stream/{camera.id}/out.m3u8"
    stream_jwt = encode_jwt(stream_path, timedelta(days=1))
    stream_url = f"{stream_host}{stream_path}?token={stream_jwt}"

    return {
        "status": "SUCCESS" if camera.online else "OFFLINE",
        "states": {
            "online": camera.online,
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

        resp[device_id] = {
            "online": camera.online,
            "status": "SUCCESS" if camera.online else "OFFLINE",
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
