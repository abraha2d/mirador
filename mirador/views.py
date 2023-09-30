from datetime import datetime, timedelta
import json
from pprint import pprint
from pytz import UTC

from django.http import HttpResponse
from oauth2_provider.views.generic import ProtectedResourceView

from camera.models import Camera


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

    return {
        "status": "SUCCESS" if online else "OFFLINE",
        "states": {
            "online": online,
            "cameraStreamProtocol": "hls",
            "cameraStreamAccessUrl": f"https://mirador.westhousefarm.com/stream/{camera.id}/out.m3u8",
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

        print("Request:")
        pprint(req)  # TODO: remove

        for req_input in req["inputs"]:
            intent = req_input["intent"]
            payload = req_input.get("payload", None)

            handler = INTENT_MAP.get(intent, None)
            if handler is not None:
                resp["payload"] = handler(request, payload)

        print("Response:")
        pprint(resp)  # TODO: remove

        print("Done.", flush=True)
        return HttpResponse(json.dumps(resp))
