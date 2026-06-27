"""HTTP view that mints a short-lived, HA-signed identity token.

The SolarControl SPA (running in the panel iframe) exchanges this token at the
SolarControl backend (`/api/v1/auth/ha/exchange`) for a normal session. The token
is signed with the shared HA-Bridge key (HMAC/HS256) and carries the Home
Assistant user's identity — crucially including `is_admin`.
"""

from __future__ import annotations

import secrets
import time
from collections.abc import Callable

import jwt
from homeassistant.components.http import HomeAssistantView

# Identity token lifetime — only needs to survive the SPA's exchange call
_TOKEN_TTL_S = 60


class SolarControlTokenView(HomeAssistantView):
    """Authenticated endpoint: GET /api/solarcontrol/token."""

    url = "/api/solarcontrol/token"
    name = "api:solarcontrol:token"
    requires_auth = True

    def __init__(self, get_config: Callable[[], dict | None]) -> None:
        self._get_config = get_config

    async def get(self, request):
        config = self._get_config()
        if not config:
            return self.json_message("SolarControl not configured", status_code=503)

        # HA guarantees an authenticated user here (requires_auth = True)
        hass_user = request["hass_user"]

        now = int(time.time())
        payload = {
            "ha_user_id": hass_user.id,
            "username": hass_user.name,
            "is_admin": bool(hass_user.is_admin),
            "iss": "homeassistant",
            "jti": secrets.token_urlsafe(16),
            "iat": now,
            "exp": now + _TOKEN_TTL_S,
        }
        token = jwt.encode(payload, config["key"], algorithm="HS256")

        return self.json({"ha_token": token, "backend_url": config["url"]})
