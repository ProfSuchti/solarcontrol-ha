"""Constants for the SolarControl integration."""

DOMAIN = "solarcontrol"

# Config entry keys
CONF_URL = "url"               # SolarControl web URL (serves the SPA + proxies /api)
CONF_KEY = "integration_key"   # shared HMAC secret (HA-Bridge key)

# Sidebar panel
PANEL_URL_PATH = "solarcontrol"
PANEL_TITLE = "SolarControl"
PANEL_ICON = "mdi:solar-power"

# Static asset serving for the panel web component
STATIC_URL = "/solarcontrol_static"
WEBCOMPONENT = "solarcontrol-panel"
