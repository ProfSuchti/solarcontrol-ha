"""SolarControl Home Assistant integration.

Thin auth bridge + sidebar panel for a remote SolarControl instance. No business
logic lives here — the panel embeds the SolarControl SPA (served from the
configured URL) in an iframe and hands it a short-lived, HA-signed identity token
so SolarControl can establish a session (mapping HA admins to SolarControl admins).
"""

from __future__ import annotations

import logging
import os

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .auth_view import SolarControlTokenView
from .const import (
    CONF_KEY,
    CONF_URL,
    DOMAIN,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL_PATH,
    STATIC_URL,
    WEBCOMPONENT,
)

_LOGGER = logging.getLogger(__name__)

# Bumped to bust the browser cache of the panel module on updates
PANEL_VERSION = "0.1.1"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up SolarControl from a config entry."""
    data = hass.data.setdefault(DOMAIN, {})
    data["config"] = {
        "url": entry.data[CONF_URL].rstrip("/"),
        "key": entry.data[CONF_KEY],
    }

    # ── Token view (register once per HA run) ────────────────────────────────
    if not data.get("_view_registered"):
        hass.http.register_view(
            SolarControlTokenView(lambda: hass.data.get(DOMAIN, {}).get("config"))
        )
        data["_view_registered"] = True

    # ── Static path for the panel web component (register once) ─────────────
    if not data.get("_static_registered"):
        panel_dir = os.path.join(os.path.dirname(__file__), "panel")
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, panel_dir, False)]
        )
        data["_static_registered"] = True

    # ── Sidebar panel (custom element) ───────────────────────────────────────
    if not data.get("_panel_registered"):
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name=WEBCOMPONENT,
            module_url=f"{STATIC_URL}/{WEBCOMPONENT}.js?v={PANEL_VERSION}",
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            require_admin=False,
            embed_iframe=False,
            config={"url": data["config"]["url"]},
        )
        data["_panel_registered"] = True

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry — removes the sidebar panel."""
    data = hass.data.get(DOMAIN, {})
    if data.get("_panel_registered"):
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
        data["_panel_registered"] = False
    data.pop("config", None)
    return True
