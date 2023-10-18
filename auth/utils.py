from datetime import datetime, timedelta
from pytz import UTC

from django.conf import settings
import jwt

from auth.constants import JWT_ALG


def encode_jwt(aud: str, exp_delta: timedelta = timedelta(minutes=5)) -> str:
    now = datetime.now(tz=UTC)
    payload = {
        "aud": aud,
        "exp": now + exp_delta,
        "nbf": now,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALG)
