# SolarControl — Home Assistant Integration

Bindet [SolarControl](https://github.com/ProfSuchti/solarcontrol) als **Reiter in die
Home-Assistant-Seitenleiste** ein und reicht die HA-Anmeldung – inklusive Admin-Status – an
SolarControl durch.

Auf Home Assistant läuft **kein** SolarControl-Backend. Die Integration ist eine schlanke
Anmeldebrücke: Sie bettet das bestehende SolarControl-Frontend (von der konfigurierten URL) in
ein iframe ein und meldet den eingeloggten HA-Nutzer automatisch an. Da das iframe direkt von der
SolarControl-URL lädt, sind Frontend und Backend same-origin – **kein CORS nötig**.

## Funktionsweise

1. In **SolarControl** → Einstellungen → System → **Home Assistant** → *SolarControl-Panel*:
   einen **Integration-Key** erzeugen und die **Panel-Anmeldung aktivieren**.
2. Diese Integration in HA mit **SolarControl-URL + Key** einrichten.
3. Eingeloggte HA-Nutzer öffnen den Reiter **„SolarControl"**. Die Integration signiert ein
   kurzlebiges Identitäts-Token (inkl. `is_admin`) und reicht es per `postMessage` an die SPA;
   SolarControl stellt daraus eine Sitzung aus.
4. **HA-Admins** werden in SolarControl zu **Admins**, alle anderen erhalten die eingestellte
   Standard-Rolle (Default `viewer`). Rollen einzelner Nutzer lassen sich in SolarControl unter
   **Benutzer** dauerhaft überschreiben.
5. **Zurück zu HA:** oben in der SolarControl-Seitenleiste der Eintrag **„‹ Home Assistant"**.

## Installation (HACS)

1. HACS → ⋮ → **Custom repositories**
2. URL: `https://github.com/ProfSuchti/solarcontrol-ha` · Kategorie: **Integration**
3. „SolarControl" installieren → **Home Assistant neu starten**
4. **Einstellungen → Geräte & Dienste → Integration hinzufügen → SolarControl**
   → **SolarControl-URL** und **HA-Integration-Key** eintragen

## Konfiguration

| Feld | Bedeutung |
|------|-----------|
| **SolarControl-URL** | Web-Adresse, unter der du SolarControl im Browser öffnest (z. B. `https://solar.example.de`). Muss **vom Browser und von HA** erreichbar sein. |
| **HA-Integration-Key** | In SolarControl unter Einstellungen → System → Home Assistant erzeugt. |

## ⚠️ HTTPS / Mixed Content

Läuft **Home Assistant über HTTPS**, muss die **SolarControl-URL ebenfalls über HTTPS** (mit
gültigem Zertifikat) erreichbar sein – sonst blockiert der Browser das iframe
(*„Laden von gemischten aktiven Inhalten … blockiert"*), und das Panel bleibt leer.

- Am einfachsten SolarControl über **denselben Reverse Proxy / dieselbe Domain** wie HA
  bereitstellen (z. B. Caddy, Nginx Proxy Manager, Traefik) → gültiges Zertifikat.
- **Selbst-signierte Zertifikate** funktionieren in iframes **nicht** zuverlässig (der
  Zertifikatsdialog erscheint im iframe nicht).
- Zum schnellen Testen: HA im Browser ausnahmsweise über **HTTP** aufrufen, dann ist auch ein
  HTTP-iframe erlaubt. Die HA-Companion-App nutzt meist die lokale HTTP-Adresse und funktioniert
  daher auch mit einer HTTP-SolarControl-URL.

Lädt das Panel nicht, zeigt es nach einigen Sekunden einen Diagnose-Hinweis (inkl.
Mixed-Content-Erkennung) statt eines leeren Bildschirms.

## Voraussetzungen

- SolarControl mit aktivierter HA-Bridge (Einstellungen → System → Home Assistant)
- Home Assistant **2024.7** oder neuer

## Lizenz

MIT
