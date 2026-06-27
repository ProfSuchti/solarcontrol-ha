# SolarControl — Home Assistant Integration

Home-Assistant-Integration für [SolarControl](https://github.com/ProfSuchti/solarcontrol)
(modulares Energiemanagementsystem). Zeigt SolarControl als **Reiter in der HA-Seitenleiste**
und reicht die HA-Anmeldung (inkl. Admin-Status) an SolarControl durch.

Auf Home Assistant läuft **kein** SolarControl-Backend — die Integration ist eine dünne
Auth-Brücke und bettet das bestehende SolarControl-Frontend ein, das auf das (entfernte)
SolarControl-Backend zugreift.

> ⚠️ **Status:** Gerüst / in Entwicklung. Die Anmeldebrücke und das Panel werden in Kürze
> ergänzt (Phase 3). Aktuell noch nicht funktionsfähig.

## Funktionsweise (geplant)

1. SolarControl erzeugt einen **HA-Integration-Key** (Settings → System → Home Assistant).
2. Diese Integration wird mit **Backend-URL + Key** konfiguriert.
3. Eingeloggte HA-Nutzer öffnen den Reiter „SolarControl"; die Integration signiert ein
   kurzlebiges Identitäts-Token (inkl. `is_admin`), SolarControl stellt daraus eine Sitzung aus.
4. HA-Admins werden in SolarControl zu Admins; alle anderen standardmäßig zu „viewer"
   (pro Nutzer in SolarControl unter `/users` anpassbar).

## Installation (HACS)

1. HACS → ⋮ → **Custom repositories**
2. URL: `https://github.com/ProfSuchti/solarcontrol-ha` · Kategorie: **Integration**
3. „SolarControl" installieren → Home Assistant neu starten
4. **Einstellungen → Geräte & Dienste → Integration hinzufügen → SolarControl**
   → Backend-URL und HA-Integration-Key eintragen

## Lizenz

MIT
