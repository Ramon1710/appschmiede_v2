# Unbegrenzte Projekte und bereinigte Startseite

Stand: 28.10.2026

## Ergebnis

Die lokale Implementierung enthält keine tarif-, abonnement- oder coinabhängige maximale Projektanzahl mehr. Dies gilt unabhängig von historischen Profilwerten wie `free`, `starter`, `pro` oder `business`. Es wurde weder ein großes Ersatzlimit noch eine neue Projektzähler-Obergrenze eingeführt.

Auf der Startseite sind die KI-Generator-Grafik des zweiten Ablaufschritts und der vollständige gemeinsame Abschnitt „KI-EINGABE“ / „KI an deiner Seite – kein Code notwendig“ entfernt. Der zweite Ablaufschritt einschließlich Beschreibung bleibt bestehen. Der Headbang-Handwerk-Bereich ist gegenüber dem vorherigen Repository-Stand bytegenau unverändert.

**Alle Änderungen sind ausschließlich lokal.** Insbesondere ist die unten beschriebene Firestore-Regelkorrektur nicht produktiv veröffentlicht. Es wurden keine vorhandenen Projekte, Benutzer, Eigentümer, Inhalte oder produktiven Daten verändert. Kein Commit, Push, Deployment oder Datenbankmigration.

## Gefundene und entfernte Grenzen

| Fundstelle | Bisheriges Verhalten | Änderung |
|---|---|---|
| [Tarifkonfiguration](../src/config/billing.ts) | `maxProjects`: free/business 9999, starter 3, pro 6 | Eigenschaft aus Typ und sämtlichen Tarifen entfernt |
| [Billing-Server](../src/lib/billing-server.ts) | `assertCanCreateProject` lud das Benutzerprofil, normalisierte den Tarif, zählte eigene Projekte und verweigerte bei erreichtem Tariflimit; 9999 galt bereits als unbegrenzt | Gesamte Projektzähl-/Tarifprüfung, ausschließlich dafür benötigte Normalisierung, Upgrade-Fehlermeldungen und `project_limit`-Fehlercode entfernt |
| [Billing-API](../src/app/api/billing/action/route.ts) | Aktion `assert-project-create` rief den tarifabhängigen Serverhelfer auf | Aktion bleibt für ältere Clients kompatibel, prüft nur noch den vorhandenen autorisierten Zugang; keine Profil-, Coin- oder Anzahlabfrage |
| [Billing-Client](../src/lib/billing-client.ts) | Unbenutzter `assertCanCreateProjectClient` koppelte Projekterstellung begrifflich an Billing | Ungenutzten Clienthelfer und zugehörigen Request-Zweig entfernt; keine Änderung an tatsächlichen Zahlungsfunktionen |
| [Projektseite](../src/app/projects/page.tsx) | Hinweis „Dein Tarif bestimmt …“ beziehungsweise englisches Gegenstück | Gesamten Hinweisabsatz entfernt; Formular, Listen und Aktionen erhalten |
| [Home-Content](../src/lib/home-content.ts) | Historische Präsentationsdaten behaupteten weiterhin 1, 3 oder 6 Projekte | Alle projektbezogenen Zeilen/Highlights in Deutsch und Englisch auf unbegrenzt vereinheitlicht, unabhängig vom kostenlosen Feature-Flag |
| [Chat](../src/app/tools/chat/page.tsx) und [Zeiterfassung](../src/app/tools/time/page.tsx) | Projektselektoren fragten höchstens 50 Projekte ab | Nur die Projektkürzung entfernt; separate Limits für Chatnachrichten und Zeitbuchungen bleiben bestehen |

Die gemeinsame [Projektservice-Schicht](../src/lib/db-projects.ts) verwendet bereits ungekürzte eigentümerbezogene Abfragen und eine von Tarif/Guthaben unabhängige Anlage. Sie wurde deshalb nicht unnötig umgebaut. Projektseite, Vorlagenübernahme und Branchenassistent wurden nachvollzogen; es gibt keine weiteren aktiven Tarifprüfungen in diesen Erstellungswegen. Der im Vorlagenmodul ebenfalls vorhandene ältere lokale Erstellungsweg schreibt weiterhin unter den vorhandenen Firestore-Regeln, nicht unter einer zusätzlichen Tarifprüfung.

Die drei Dashboard-Karten „Zuletzt bearbeitet“ sind eine gekürzte Vorschau, **keine** Grenze der gespeicherten oder über „Projekte“ erreichbaren Projekte. Diese Darstellung bleibt unverändert. Die interne Analyseseite zählt Projekte für die Anzeige; sie verweigert keine Erstellung und wurde nicht geändert.

Historische Stripe-Konfigurationen, Tarifeigenschaften ohne Projektlimit, Guthabenfelder und Zahlungsvorgänge bleiben erhalten. Die kostenlose KI-Nutzung aus den vorherigen Aufträgen bleibt unverändert.

## Firestore-Regelkorrektur ohne pauschale Lockerung

Bei der echten Emulatorprüfung konnten autorisierte Nutzer zwar eigene Projekte anlegen und einzeln lesen, aber die verwendete Abfrage `where('ownerId', '==', uid)` wurde durch die bestehenden Regeln abgelehnt. Die bisherige Projekt-Leseregel ermittelte das Dokument über einen zusätzlichen `get(projectPath)`-Aufruf. Diese Form war nicht mit der benötigten Listenabfrage beweisbar.

Die [Projekt-Leseregel](../firestore.rules) verwendet jetzt die Daten des gerade abgefragten Dokuments (`resource.data`). Die Bedingungen bleiben inhaltlich:

- angemeldet **und** aktiver, zur E-Mail passender Grant oder Administratorrolle;
- Eigentümer über `ownerId` / Kompatibilitätsfeld `ownerUid`, Projektmitglied oder berechtigter Administrator.

Die Regeln für Anlage, Änderung, Löschung und Projektseiten bleiben unverändert. Keine offenen globalen Lese- oder Schreibrechte, keine gelockerten Rollen-, Grant-, Profil- oder Einladungsregeln.

Emulatortests bestätigen neben der nun funktionierenden Eigentümerliste, dass anonyme und nicht freigeschaltete Nutzer keine Projekte erstellen und andere Mitglieder fremde Projekte weder lesen, ändern, löschen noch als Eigentümer anlegen können. Ungefilterte Listen und gezielte Abfragen nach fremden Eigentümern werden abgelehnt.

**Betriebshinweis:** Solange diese korrigierten Regeln nicht später ausdrücklich autorisiert veröffentlicht werden, ändert sich das Verhalten produktiv installierter alter Regeln nicht. Dieser Auftrag beinhaltet kein solches Deployment.

## Startseite

In [der Startseite](../src/app/page.tsx) entfernt:

1. `AIGeneratorMini` samt Grafikrahmen, Prompt, generierten Seiten, vorgeschlagenen Bausteinen und Live-Markierung.
2. Grafikeinbindung im Schritt „Mit KI erweitern“; Schritttext und Nummerierung bleiben.
3. `AiPromptVisual` und die ausschließlich dafür verwendete Referenz auf `kiHighlights`.
4. Gesamter übergeordneter Zwei-Spalten-Abschnitt mit KI-Eingabe, Service-App-Beispiel, Erklärung und Feature-Kacheln.

Keine leeren Grafikcontainer bleiben zurück. Der zweite Schritt erhält keinen bisherigen Grafik-Text-Abstand mehr; die Ablaufkarten werden oben ausgerichtet, statt die nun kürzere Karte künstlich auf die volle Höhe zu strecken. Vorhandene Dark-Mode-Farben und responsive Breakpoints bleiben.

Andere Abschnitte, Navigation und tatsächliche KI-APIs/-Konfigurationen wurden nicht verändert. Insbesondere bleibt die separate kleine KI-Prompt-Karte im Hero erhalten: Sie ist nicht der beauftragte große KI-Eingabe-Abschnitt. Vorlagen-, Editor-, Branchenassistent- und Bild-/Seitengenerierungsfunktionen bleiben vorhanden.

## Geänderte Dateien dieses Auftrags

1. [Startseite](../src/app/page.tsx)
2. [Projektseite](../src/app/projects/page.tsx)
3. [Chat-Projektauswahl](../src/app/tools/chat/page.tsx)
4. [Zeiterfassungs-Projektauswahl](../src/app/tools/time/page.tsx)
5. [Tarifkonfiguration](../src/config/billing.ts)
6. [Billing-Server](../src/lib/billing-server.ts)
7. [Billing-Client](../src/lib/billing-client.ts)
8. [Billing-Aktionsroute](../src/app/api/billing/action/route.ts)
9. [Home-Content und Übersetzungen](../src/lib/home-content.ts)
10. [Firestore-Regeln](../firestore.rules)
11. [Firestore-/Storage-Emulatortests](../tests/firebase-rules.test.mjs)
12. [Neue Projekt-/Startseiten-Regressionstests](../tests/unlimited-projects.test.mjs)
13. [README](../README.md)
14. [Dieser Bericht](./unlimited-projects-2026-10-28.md)

Bereits vorhandene Änderungen aus vorherigen Benutzeraufträgen wurden beibehalten. Die Emulatoren erzeugten eine lokale Debug-Logänderung; diese rein generierte Änderung wurde nach den Tests entfernt.

## Tests

### Projektservice, Oberfläche und weitere Regressionen

```bash
node --test --test-reporter=dot tests/unlimited-projects.test.mjs tests/privacy-consent.test.mjs tests/legal-pages.test.mjs tests/editor-free-access.test.mjs tests/profile-security.test.mjs tests/invitation-core.test.mjs tests/smtp-client.test.mjs
```

**80 Tests bestanden.** Darunter:

- Älterer Projekt-API-Aktionstyp erlaubt autorisierte Nutzer für alle vier Tarifwerte ohne Anzahl-/Guthabenprüfung und lehnt nicht autorisierte Anfragen ab.
- Sämtliche Tarifkonfigurationen enthalten keine Projektobergrenze; Übersetzungen behaupten keine.
- Gemeinsamer Projektservice erzeugt **10.005 weitere Projekte** neben einem bestehenden Projekt in einer Firestore-Simulation; Liste und Subscription liefern alle 10.006. Umbenennung und gezielte Löschung funktionieren, das bestehende Projekt bleibt unverändert.
- Projektübersicht rendert **alle 200 Testprojekte**, Formular und Aktionen, jeweils auf Deutsch und Englisch.
- Startseite rendert in beiden Sprachen ohne die beauftragten entfernten Grafiken, aber mit allen drei Ablaufbeschreibungen, übrigen Hauptabschnitten und Vereinslink.
- Bestehende Editor-, KI-, Profil-, Consent-, Rechtsseiten-, Einladungs- und SMTP-Regressionen bestehen weiter.

### Echte Regeln im isolierten Emulator

```bash
npm run test:rules
```

**13 Tests bestanden**, mit Firestore und Storage ausschließlich im Projekt `demo-appschmiede-v2`:

- Je ein autorisierter Benutzer pro historischem Tarif erstellt **55 Projekte**, also mehr als 3, 10 und auch mehr als 50.
- Insgesamt 220 angelegte Testprojekte; Liste, neuer authentifizierter Testkontext, erneutes Lesen, Bearbeiten und gezieltes Löschen funktionieren.
- Unverändertes Bestandsprojekt und unverändertes Null-Coin-Guthaben überprüft.
- Nicht freigeschaltete, anonyme und fremde Konten werden bei geschützten Zugriffen abgelehnt.
- Rollenänderung, Guthabenmanipulation, Profil-/Grant-/Einladungserstellung und fremde Storage-Zugriffe bleiben gesperrt.

Erwartete `PERMISSION_DENIED`-Meldungen gehören zu Negativtests. Die Emulator-Laufzeit meldet eine Java-/Protobuf-Veraltungswarnung, beendet den Testlauf aber erfolgreich. Die Emulatoren wurden anschließend automatisch beendet. Es gab keine Produktiv-Massenerstellung und keine echte Anmeldung gegen produktives Firebase.

### Build, Typen, Lint und Layout

- **Produktionsbuild:** `npm run build` erfolgreich.
- **TypeScript:** separat 35 bereits vorhandene Repository-Diagnosen, keine in den für diesen Auftrag geänderten TypeScript-Dateien. Die bestehende Next.js-Konfiguration überspringt Typfehler im Build; ein erfolgreicher Build bedeutet daher keine globale Typfehlerfreiheit.
- **ESLint:** Tarifkonfiguration, Billing-Helfer/-Route, Home-Content und neue/geänderte Tests ohne Meldungen. In den bereits bestehenden Seiten bleiben dieselben Befunde wie in `HEAD`: Startseite 3 Warnungen, Projekte 5 Fehler/1 Warnung, Chat 1 Fehler/2 Warnungen, Zeiterfassung 3 Fehler/2 Warnungen. Regeln, Schwere und Meldungsinhalte wurden verglichen; keine neuen Befunde.
- **Headbang-Bereich:** Quellabschnitt bytegenau mit `HEAD` verglichen, unverändert.
- **Produktions-Smoke-Test:** Startseite liefert Deutsch/Englisch mit HTTP 200, ohne entfernte Grafiken, mit Ablaufschritt 2 und Vereinsbereich. Nicht angemeldete Projektanfragen signalisieren weiterhin die Login-Umleitung. Temporärer lokaler Server wieder beendet.
- **Responsive Prüfung:** bestehende Breakpoints, mobile Kartenstruktur und vollständige HTML-Ausgabe geprüft. Kein verfügbarer Browser für eine visuelle Desktop-/Tablet-/Smartphone-Abnahme; keine solche Abnahme behauptet.
- **Whitespace:** `git diff --check` erfolgreich.

## Verbleibende technische Grenzen

„Unbegrenzt“ bezeichnet das Fehlen einer künstlichen Projektanzahlgrenze, nicht unbegrenzte Hardware oder garantierte dauerhafte Verfügbarkeit. Firestore-Dokumentgrößen, Abfragekosten, Kontingente, Dateispeicher, Arbeitsspeicher, Netzwerk und Dienstverfügbarkeit bleiben maßgeblich.

Projektlisten und Selektoren laden derzeit alle passenden Projekte; bei sehr großen Beständen steigen Ladeaufwand und Renderingkosten. Es wurde keine neue versteckte Maximalanzahl eingeführt. Eine spätere Paginierung oder Virtualisierung müsste alle Projekte weiterhin erreichbar halten.

Vorhandene Authentifizierung, Grants, Einladungs-Ratenbegrenzungen, KI-Prompt-/Ausgabelimits und Einzelprojektvalidierungen bleiben erhalten. Ein eigener serverseitiger Projekt-Erstellungs-Rate-Limiter war im bestehenden direkt über Firestore schreibenden Erstellungsweg nicht vorhanden und wurde weder entfernt noch durch ein Projektanzahllimit ersetzt. Anbieterquoten bleiben bestehen; sie sind nicht mit einem zusätzlich implementierten anwendungsseitigen Missbrauchslimiter gleichzusetzen.

**Keine produktiven Daten oder Benutzer geändert. Kein Commit, Push oder Deployment durchgeführt.**
