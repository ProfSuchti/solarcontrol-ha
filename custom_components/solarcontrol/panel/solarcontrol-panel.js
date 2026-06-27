// SolarControl HA sidebar panel.
//
// Home Assistant instantiates this custom element and injects `hass` + `panel`.
// It embeds the SolarControl SPA in an iframe and, when the SPA asks for
// credentials, fetches a fresh HA-signed identity token via the authenticated
// HA API and hands it over by postMessage.
//
//   SPA  → panel:  { type: 'sc-ha-request' }
//   panel → SPA:   { type: 'sc-ha-credentials', backend_url, ha_token }

const REQUEST_TYPE = "sc-ha-request";
const CRED_TYPE = "sc-ha-credentials";

class SolarControlPanel extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._initialised) {
      this._initialised = true;
      this._init();
    }
  }

  set panel(panel) {
    this._panel = panel;
  }

  _baseUrl() {
    const url = (this._panel && this._panel.config && this._panel.config.url) || "";
    return url.replace(/\/$/, "");
  }

  _init() {
    const base = this._baseUrl();
    this.style.display = "block";
    this.style.height = "100%";

    if (!base) {
      this._showError("SolarControl ist nicht konfiguriert.");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.setAttribute("allow", "fullscreen; clipboard-write");
    iframe.style.cssText =
      "border:0;width:100%;height:100%;display:block;background:#0b0f14";
    this._iframe = iframe;

    this._onMessage = this._onMessage.bind(this);
    window.addEventListener("message", this._onMessage);

    // ?ha_bridge=1 tells the SPA it runs inside the HA panel
    iframe.src = `${base}/?ha_bridge=1`;
    this.innerHTML = "";
    this.appendChild(iframe);
  }

  async _onMessage(event) {
    if (!this._iframe || event.source !== this._iframe.contentWindow) return;
    if (!event.data || event.data.type !== REQUEST_TYPE) return;

    try {
      // Authenticated call → HA resolves the user (incl. is_admin) server-side
      const cred = await this._hass.callApi("GET", "solarcontrol/token");
      const targetOrigin = new URL(cred.backend_url).origin;
      this._iframe.contentWindow.postMessage(
        {
          type: CRED_TYPE,
          backend_url: cred.backend_url,
          ha_token: cred.ha_token,
        },
        targetOrigin
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[solarcontrol] token request failed", err);
      this._showError(
        "Anmeldung an SolarControl fehlgeschlagen. Ist die Integration korrekt konfiguriert (URL & Key)?"
      );
    }
  }

  _showError(msg) {
    this.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;
                  height:100%;padding:24px;text-align:center;
                  font-family:var(--paper-font-body1_-_font-family,sans-serif);
                  color:var(--primary-text-color,#ddd);background:var(--card-background-color,#111)">
        <div>
          <div style="font-size:16px;font-weight:600;margin-bottom:8px">SolarControl</div>
          <div style="font-size:13px;opacity:.8">${msg}</div>
        </div>
      </div>`;
  }

  disconnectedCallback() {
    if (this._onMessage) window.removeEventListener("message", this._onMessage);
  }
}

customElements.define("solarcontrol-panel", SolarControlPanel);
