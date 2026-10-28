# Entfernung der Werbeintegration und Prüfung der Datenschutzeinstellungen

Stand: 28.10.2026

## Ergebnis

Google AdSense ist vollständig aus dem ausführbaren Anwendungscode entfernt. Es gibt keinen Werbeskript-Loader, keine Anzeigenkomponente, keine Publisher-Metadaten und keine auswertbaren Werbe-Feature-Flags oder Slot-Konfigurationsvorlagen mehr. Andere Google-/Firebase-Dienste, Anmeldung, Einladungen und die Headbang-Handwerk-Präsentation bleiben unverändert.

Nach ausdrücklicher Rückfrage wurde **keine Firebase-Analytics-Integration neu eingeführt**. Der gewünschte Beschreibungstext steht unverändert unter „Analyse“. Direkt darunter wird erklärt:

> Firebase Analytics ist derzeit nicht aktiviert. Der Schalter speichert nur Ihre Auswahl und startet aktuell keine Datenerhebung. Eine spätere Aktivierung erfordert eine neue Einwilligung.

Damit wird das gewünschte UI erhalten, ohne ungefragt Tracking zu aktivieren oder Firebase Analytics als bereits eingesetzten Dienst auszugeben.

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| [Root-Layout](../src/app/layout.tsx) | Loader-Import/-Aufruf, Aktivierungsflag und Google-Publisher-Metadaten entfernt |
| Ehemalige Komponente `src/components/AdSenseLoader.tsx` | Datei mit externer Skriptquelle und Consent-abhängigem Laden gelöscht |
| Ehemalige Komponente `src/components/GoogleAdSlot.tsx` | Datei mit Anzeigenplätzen, Werbeplatzhaltern, Queue, Publisher-Kennung und dynamischer Slot-Konfiguration gelöscht; keine weiteren Aufrufstellen gefunden |
| [Konfigurationsvorlage](../.env.example) | Acht ausschließlich für Werbeplätze bestimmte Slot-Variablen entfernt |
| [Consent-Banner](../src/components/ConsentBanner.tsx) | Kategorie „Analyse“, gewünschter Beschreibungstext, sichtbarer Inaktivitätsstatus, zugänglich beschrifteter Schalter, werbefreier Bannertext |
| [Consent-Speicherhelfer](../src/lib/privacy-consent.ts) | Neue zweckgebundene Version; Prüfung von Version, Alter und gültigem Zeitstempel |
| [Datenschutzerklärung](../src/app/datenschutz/page.tsx) | Werbeabschnitt/-empfänger/-freigabepunkte entfernt; 14 fortlaufende Abschnitte; aktuelles Analyse-/Consent-Verhalten beschrieben |
| [Firebase-Hinweise](../src/app/datenschutz/firebase/page.tsx) | Werbeverweis entfernt; kein aktives Analytics und keine Aktivierung durch die gespeicherte Auswahl |
| [Rechtstexttests](../tests/legal-pages.test.mjs) | Erwartungen an entfernten Abschnitt und aktuelle Inaktivität angepasst |
| [Consent-Regressionstests](../tests/privacy-consent.test.mjs) | Acht Tests zu Speicherung, Migration, Dialogaktionen, Widerruf, Neuladen und vollständiger Entfernung |
| [README](../README.md) | Aktueller Status und Testkommando dokumentiert |
| [Vorheriger Rechtstextbericht](./legal-review-2026-10-28.md) | Als teilweise überholte Bestandsaufnahme gekennzeichnet; Verweis auf gelöschten Loader entfernt und aktueller Bericht verlinkt |
| [Dieser Bericht](./privacy-without-advertising-2026-10-28.md) | Änderungen, technische Grenzen und Testergebnisse dokumentiert |

Die AGB und Übersetzungsdateien wurden ebenfalls geprüft; dort waren keine zu entfernenden Werbeintegrationsangaben vorhanden. Die Consent-Oberfläche und die Rechtstexte besitzen derzeit keine separate englische Fassung. Im Anwendungscode, öffentlichen Assets und Konfigurationsvorlagen verbleiben keine einschlägigen Werbereferenzen. Nennungen in historischen Berichten und Negativtests sind reine Dokumentation beziehungsweise Schutz gegen Wiedereinführung, keine Einbindungen.

Private lokale Umgebungsdateien und externe Hosting-Einstellungen wurden nicht verändert. Dort gegebenenfalls noch vorhandene alte Variablen werden vom Anwendungscode nicht mehr ausgewertet. Sie können bei einer später autorisierten Konfigurationsbereinigung entfernt werden; ein altes Flag kann die gelöschten Komponenten nicht reaktivieren.

## Einwilligungsprüfung

| Fall | Nachgewiesenes Verhalten |
|---|---|
| Keine gespeicherte Auswahl | Banner erscheint; optionaler Schalter initial aus |
| Alte kombinierte Auswahl | Alte Version wird nicht auf den neuen Zweck übertragen; erneute Auswahl erforderlich, unabhängig vom früheren Ja/Nein |
| Aktuelle Zustimmung | `analytics: true`, aktuelle Versionskennung und Zeitstempel werden gespeichert; kein Dienst wird gestartet |
| „Alle ablehnen“ | `analytics: false` wird gespeichert und als Änderungsereignis mitgeteilt; keine optionale Analyse aktiv |
| „Alle akzeptieren“ | Speichert nur die Analyse-Auswahl; aktiviert weder Werbung noch Firebase Analytics |
| „Auswahl speichern“ | Speichert den tatsächlichen Schalterzustand |
| Erneutes Öffnen / Widerruf | Footer-Einstellungsaktion öffnet den Dialog; Zustimmung und Ablehnung können geändert werden |
| Neuladen | Aktuelle gültige Zustimmung beziehungsweise Ablehnung bleibt erhalten; erneute Dialogöffnung zeigt den gespeicherten Zustand |
| Ungültige, abgelaufene oder zukünftige Zeitangaben | Nicht als gültige Auswahl verwendet; erneute Auswahl erforderlich |
| Speicherung | Cookie maximal 180 Tage; lokale Auswahl wird ebenfalls nur höchstens 180 Tage als gültig verwendet |
| Serverrendering | Speicherhelfer greifen ohne Browser nicht auf Browser-APIs zu |

Die neue Version lautet `2026-10-28-analysis-only`. Ein lokaler Eintrag ohne gültige aktuelle Version oder mit ungültigem Alter bleibt gegebenenfalls physisch im Speicher, bis die Auswahl erneut gespeichert oder der Website-Speicher gelöscht wird. Er berechtigt zu keiner Verarbeitung.

Eine spätere Analytics-Einführung muss gesondert implementiert und rechtlich freigegeben werden. Dazu gehören aktualisierte Informationen, erneute ausdrückliche Zustimmung, zuverlässige Aktivierungs-/Deaktivierungslogik sowie Prüfung der Speicherungen und internationalen Übermittlungen. Die jetzige Auswahl darf nicht ungeprüft als Einwilligung für diese künftige Integration übernommen werden.

„Essenziell“, der Push-Hinweis und alle drei Dialogbuttons bleiben erhalten. Firebase Push ist weiterhin nicht initialisiert. Der Hinweis auf externe Medien bleibt ebenfalls erhalten: Maps, Video, QR und externe Bilder sind nicht generell an den Analyse-Schalter gekoppelt. Die Entfernung des Werbecodes löst diese gesonderten Freigabepunkte nicht.

## Tests und Build

Ausgeführt:

```bash
node --test --test-reporter=dot tests/privacy-consent.test.mjs tests/legal-pages.test.mjs tests/editor-free-access.test.mjs tests/profile-security.test.mjs tests/invitation-core.test.mjs tests/smtp-client.test.mjs
npm run build
```

- **69 gezielte Tests bestanden**, darunter acht neue Consent-/Entfernungstests.
- **Produktionsbuild erfolgreich**; generierte Server- und Browserbundles enthalten keine Werbeskriptquelle, Publisher-Kennung, Anzeigen-Queue oder Slot-/Aktivierungsvariable.
- Lokaler Produktions-Smoke-Test: HTTP 200 für `/`, `/datenschutz`, `/datenschutz/firebase`, `/agb`, `/impressum` und `/login`; kein Werbeskript, keine Publisher-Metadaten, keine alte kombinierte Kategorie; Datenschutz-Footerlink erhalten. Temporärer Server anschließend beendet.
- Geänderte Rechtstexte, Layout, Speicherhelfer und Testdateien bestehen den gezielten ESLint-Lauf. Im Consent-Banner bleibt die bereits vor diesem Auftrag vorhandene Meldung `react-hooks/set-state-in-effect` zur anfänglichen Browserzustandsübernahme bestehen; keine sachfremde Hook-Umstellung vorgenommen.
- Separater TypeScript-Programmlauf: **35 bestehende Repository-Diagnosen, keine in den für diesen Auftrag geänderten TypeScript-Dateien**. Die vorhandene Build-Konfiguration überspringt Typfehler; der erfolgreiche Build ist deshalb kein sauberer globaler Typcheck.
- `git diff --check` erfolgreich.
- Dark-Mode-Klassen und responsive Struktur des Dialogs bleiben erhalten; Schalter und Dialogaktionen wurden mit simulierten React-/Browserzuständen getestet. Keine visuelle Geräteprüfung oder vollständige Browserautomation behauptet.

Bereits im Browser einer früheren veröffentlichten Fassung laufende Fremdskripte werden nicht rückwirkend beendet und bestehende Fremdcookies nicht automatisch gelöscht. Nach einer später autorisierten Veröffentlichung und einem vollständigen Neuladen liefert diese Fassung keine Werbeintegration mehr aus. Dieser Auftrag beinhaltet ausdrücklich kein Deployment.

Keine Produktivdaten verändert, keine echten Analyse-/Werbe-/Zahlungsanforderungen erzeugt. **Kein Commit, kein Push und kein Deployment durchgeführt.** Vorherige beauftragte Änderungen im Arbeitsverzeichnis bleiben erhalten.
