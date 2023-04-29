import json
from pprint import pprint

from django.http import HttpResponse
from oauth2_provider.views.generic import ProtectedResourceView

from camera.models import Camera


class Fulfillment(ProtectedResourceView):
    def post(self, request, *args, **kwargs):
        req = json.loads(request.body)
        pprint(req)
        resp = {"requestId": req["requestId"], "payload": {}}
        for i in req["inputs"]:
            if i["intent"] == "action.devices.SYNC":
                resp["payload"] = {
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
                                    "webrtc",
                                    "hls",
                                    "dash",
                                    "smooth_stream",
                                    "progressive_mp4",
                                ],
                                "cameraStreamNeedAuthToken": False,
                            },
                        }
                        for c in Camera.objects.all()
                    ],
                }
            elif i["intent"] == "action.devices.QUERY":
                device_ids = [d["id"] for d in i["payload"]["devices"]]
                # TODO: Actually get online state
                resp["payload"] = {
                    "devices": {
                        di: {
                            "status": "SUCCESS",
                            "online": True,
                        }
                        for di in device_ids
                    },
                }
        pprint(resp)
        print("Done.", flush=True)
        return HttpResponse(json.dumps(resp))
