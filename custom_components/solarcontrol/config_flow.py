"""Config flow for the SolarControl integration."""

from __future__ import annotations

import aiohttp
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import CONF_KEY, CONF_URL, DOMAIN


class SolarControlConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle the UI configuration: SolarControl URL + HA-Bridge key."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        errors: dict[str, str] = {}

        if user_input is not None:
            url = user_input[CONF_URL].rstrip("/")
            key = user_input[CONF_KEY].strip()

            # Single instance only
            await self.async_set_unique_id(DOMAIN)
            self._abort_if_unique_id_configured()

            if await self._reachable(url):
                return self.async_create_entry(
                    title="SolarControl",
                    data={CONF_URL: url, CONF_KEY: key},
                )
            errors["base"] = "cannot_connect"

        schema = vol.Schema(
            {
                vol.Required(CONF_URL): str,
                vol.Required(CONF_KEY): str,
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    async def _reachable(self, url: str) -> bool:
        """Check that the SolarControl HA-Bridge status endpoint responds."""
        session = async_get_clientsession(self.hass)
        try:
            async with session.get(
                f"{url}/api/v1/auth/ha/status",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                return resp.status == 200
        except Exception:  # noqa: BLE001 — any failure means "not reachable"
            return False
