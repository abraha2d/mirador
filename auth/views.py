from datetime import timedelta
from urllib.parse import parse_qs, urlparse

from django.conf import settings
from django.http import HttpResponse
import jwt

from auth.constants import JWT_ALG
from auth.utils import encode_jwt


def token_check(request):
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


def token_request(request):
    aud = request.GET.get("aud", "")
    kwargs = {}

    if aud[-5:] == ".m3u8":
        kwargs["exp_delta"] = timedelta(days=1)

    token = encode_jwt(aud, **kwargs)
    return HttpResponse(token, status=200)
