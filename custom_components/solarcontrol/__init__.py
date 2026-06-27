"""SolarControl Home Assistant integration (skeleton).

Thin auth bridge + sidebar panel for a remote SolarControl backend.
The SolarControl backend/frontend live in a separate (private) repository;
this integration intentionally contains no business logic.

Planned implementation (Phase 3 — see the main project's HA_INTEGRATION_PLAN.md):
  - config_flow:  backend URL + HA integration key
  - auth_view:    HTTP view `/api/solarcontrol/token` (requires_auth) that signs a
                  short-lived HMAC JWT from request["hass_user"] (.id/.name/.is_admin)
  - panel:        sidebar entry that loads the remote SolarControl frontend (iframe)
"""

from __future__ import annotations

from .const import DOMAIN  # noqa: F401


async def async_setup(hass, config):
    """Placeholder setup — replaced in Phase 3."""
    return True
