// SolarControl HA sidebar panel.
//
// Home Assistant instantiates this custom element and injects `hass` + `panel`.
// It embeds the SolarControl SPA in an iframe and, when the SPA asks for
// credentials, fetches a fresh HA-signed identity token via the authenticated
// HA API and hands it over by postMessage.
//
//   SPA  → panel:  { type: 'sc-ha-request' }            → request credentials
//   panel → SPA:   { type: 'sc-ha-credentials', backend_url, ha_token }
//   SPA  → panel:  { type: 'sc-ha-navigate-home' }       → leave panel, back to HA

const REQUEST_TYPE = "sc-ha-request";
const CRED_TYPE = "sc-ha-credentials";
const NAVIGATE_HOME = "sc-ha-navigate-home";

// If the SPA never asks for credentials within this window, the iframe most
// likely failed to load (mixed content, unreachable URL, …) → show a hint.
const LOAD_TIMEOUT_MS = 9000;

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
    this.style.position = "relative";
    this.style.height = "100%";

    if (!base) {
      this._showError(
        "SolarControl ist nicht konfiguriert.",
        "Bitte die Integration unter Einstellungen → Geräte & Dienste neu einrichten."
      );
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.setAttribute("allow", "fullscreen; clipboard-write; clipboard-read");
    iframe.style.cssText =
      "border:0;width:100%;height:100%;display:block;background:#0b0f14";
    this._iframe = iframe;

    this._onMessage = this._onMessage.bind(this);
    window.addEventListener("message", this._onMessage);

    // Erfolgreiches Laden des iframes (auch cross-origin) beendet den Watchdog —
    // unabhängig davon, ob die SPA Anmeldedaten anfragt (z.B. bei bestehender Sitzung
    // sendet sie kein sc-ha-request).
    iframe.addEventListener("load", () => this._clearWatchdog());

    // ?ha_bridge=1 tells the SPA it runs inside the HA panel
    iframe.src = `${base}/?ha_bridge=1`;
    this.innerHTML = "";
    this.appendChild(iframe);

    // Watchdog: feuert nur, wenn das iframe gar nicht lädt (z.B. URL unerreichbar,
    // Mixed Content) — dann erscheint der Diagnose-Hinweis.
    this._watchdog = setTimeout(() => {
      this._showLoadHint(base);
    }, LOAD_TIMEOUT_MS);
  }

  _clearWatchdog() {
    if (this._watchdog) {
      clearTimeout(this._watchdog);
      this._watchdog = null;
    }
  }

  async _onMessage(event) {
    if (!this._iframe || event.source !== this._iframe.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === REQUEST_TYPE) {
      // The SPA is alive → cancel the load watchdog
      this._clearWatchdog();
      await this._sendCredentials();
    } else if (data.type === NAVIGATE_HOME) {
      this._navigateHome();
    }
  }

  async _sendCredentials() {
    try {
      // Authenticated call → HA resolves the user (incl. is_admin) server-side
      const cred = await this._hass.callApi("GET", "solarcontrol/token");
      const targetOrigin = new URL(cred.backend_url).origin;
      this._iframe.contentWindow.postMessage(
        { type: CRED_TYPE, backend_url: cred.backend_url, ha_token: cred.ha_token },
        targetOrigin
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[solarcontrol] token request failed", err);
      this._showError(
        "Anmeldung an SolarControl fehlgeschlagen.",
        "Ist die Integration korrekt konfiguriert (URL & Key) und die Panel-Anmeldung in SolarControl aktiviert?"
      );
    }
  }

  _navigateHome() {
    const def = (this._hass && this._hass.defaultPanel) || "lovelace";
    history.pushState(null, "", "/" + def);
    window.dispatchEvent(new CustomEvent("location-changed"));
  }

  _showLoadHint(base) {
    const isHttp = base.startsWith("http://");
    const haHttps = location.protocol === "https:";
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;" +
      "padding:24px;text-align:center;background:var(--card-background-color,#0b0f14);" +
      "font-family:var(--paper-font-body1_-_font-family,sans-serif);color:var(--primary-text-color,#ddd)";
    const mixed =
      isHttp && haHttps
        ? `<div style="font-size:13px;color:#ffb74d;margin-bottom:10px">
             Wahrscheinlich <b>Mixed Content</b>: Home Assistant läuft über HTTPS, SolarControl
             aber über HTTP. Browser blockieren das. Rufe HA über HTTP auf oder stelle
             SolarControl über HTTPS bereit.</div>`
        : "";
    overlay.innerHTML = `
      <div style="max-width:420px">
        <div style="font-size:16px;font-weight:600;margin-bottom:8px">SolarControl lädt nicht</div>
        ${mixed}
        <div style="font-size:13px;opacity:.85;margin-bottom:14px">
          Die Seite <code>${base}</code> konnte im Panel nicht geladen werden.
          Prüfe, ob die URL vom Browser erreichbar ist.
        </div>
        <a href="${base}/?ha_bridge=1" target="_blank" rel="noopener"
           style="display:inline-block;padding:8px 16px;border-radius:6px;font-size:13px;
                  background:rgba(0,212,255,.12);border:1px solid rgba(0,212,255,.4);
                  color:var(--primary-color,#03a9f4);text-decoration:none">
          In neuem Tab öffnen
        </a>
      </div>`;
    // Place above the (blank) iframe
    this.appendChild(overlay);
  }

  _showError(title, detail) {
    this.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;
                  height:100%;padding:24px;text-align:center;
                  font-family:var(--paper-font-body1_-_font-family,sans-serif);
                  color:var(--primary-text-color,#ddd);background:var(--card-background-color,#111)">
        <div style="max-width:420px">
          <div style="font-size:16px;font-weight:600;margin-bottom:8px">SolarControl</div>
          <div style="font-size:13px;opacity:.8">${title}</div>
          ${detail ? `<div style="font-size:12px;opacity:.6;margin-top:8px">${detail}</div>` : ""}
        </div>
      </div>`;
  }

  disconnectedCallback() {
    if (this._onMessage) window.removeEventListener("message", this._onMessage);
    if (this._watchdog) clearTimeout(this._watchdog);
  }
}

customElements.define("solarcontrol-panel", SolarControlPanel);
