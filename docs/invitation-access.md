# Einladungszugang

## Architektur und Adminrollen

Firebase Authentication bleibt aktiv. Das öffentliche Formular unter `/register` legt keine Konten mehr an. Ein neues Firebase-Konto kann nur über `/invite?token=...` mit der in einer gültigen Einladung festgelegten E-Mail-Adresse erstellt werden.

Die Berechtigung stammt aus serververwalteten `accessGrants/{uid}` oder dem bereits gespeicherten `users/{uid}.role == 'admin'`. Administratorrechte werden nicht aus E-Mail-Adressen abgeleitet. Clientregeln verhindern das Erstellen von Profilen und das Ändern der Rolle; Einladungskonten erhalten immer `role: user`.

Nach Anmeldung oder Einladungseinlösung tauscht `/api/auth/session` ein gültiges Firebase-ID-Token gegen ein fünf Tage gültiges HttpOnly-Cookie `__session`. Nur ein aktives Grant oder ein Profil mit Adminrolle erhält dieses Cookie. Dashboard, Editor, Projekte, Profil, Vorschau, Tools und Wizard validieren es serverseitig inklusive Firebase-Revocation und aktuellem Grant/Rollenfeld. API-Routen prüfen ID-Token und Berechtigung serverseitig; Firestore- und Storage-Regeln wenden dieselben Rollen-/Grantbedingungen unabhängig vom UI an. Logout löscht das Cookie.

## Einladungen und Versand

Die Adminverwaltung ist unter `/tools/invitations` erreichbar. Der Server prüft `users/{uid}.role === 'admin'` bei jeder Listen-, Erstell-, Widerruf- und Aktion zum erneuten Versand. Die Navigation und der Seiteninhalt sind nur die UI-Schicht.

Ein Token besteht aus 32 kryptografisch zufälligen Bytes. Firestore speichert ausschließlich den SHA-256-Hash (`tokenHash`) in `invitations/{id}`, niemals den Klartext. Einladungseinträge enthalten Ziel-E-Mail, Lifecycle-Status (`pending`, `redeemed`, `expired`, `revoked`), Versandstatus (`sending`, `sent`, `failed`), Ablaufzeit, Ersteller-UID/E-Mail, Mail-Message-ID (`providerMessageId`) und Zeitstempel. Einladungen laufen nach sieben Tagen ab und sind einmalig. Bestehende Message-IDs bleiben als historische Daten erhalten.

`invitationEmailLocks/{sha256(email)}` serialisiert gleichzeitige Einladungen pro normalisierter Zieladresse. Ein aktives Duplikat wird abgelehnt. „Erneut senden“ erstellt ein neues Token und Dokument und widerruft den vorherigen Pending-Link in derselben Firestore-Transaktion. Widerruf und Einlösung konkurrieren ebenfalls transaktional, sodass nur ein Vorgang den Status ändern kann.

Der Einladungsversand nutzt serverseitig Nodemailer und denselben SMTP-Server, den der Verein für seine Website verwendet. Dessen tatsächliche Verbindungsdaten müssen separat übernommen werden; sie sind nicht im Repository hinterlegt. Firebase-Auth-Verifizierungsmails laufen weiterhin über Firebase. Betreff und HTML-/Textinhalt samt Logo und Vereinsangaben bleiben unverändert. Eine optionale persönliche Nachricht wird auf 500 Zeichen begrenzt und im HTML escaped. Der Transport erhält nur den bereits erzeugten Einladungslink und erstellt keinen Token. Die nicht geheime Einladungs-ID wird als `X-AppSchmiede-Invitation-ID` mitgesendet; sie ist kein SMTP-Idempotenzschlüssel. Tokens und Zugangsdaten werden nicht protokolliert oder in API-Antworten ausgegeben.

`deliveryStatus: sent` bedeutet nur, dass der SMTP-Server den Empfänger und die Nachricht angenommen hat; es bestätigt keine Zustellung ins Postfach. Ablehnungen oder nicht bestätigter Versand ergeben `failed` mit einem bereinigten Fehlercode. SMTP-Annahme und Firestore-Update sind keine gemeinsame Transaktion. Bei Timeout oder Verbindungsabbruch kann der Annahmestatus unklar sein; es gibt deshalb keine automatischen Wiederholungen und keine Exactly-once-Garantie für E-Mails. Ein länger als fünf Minuten offener Versand wird als `unknown` angezeigt. Vor erneutem Versand den Mailserverstatus prüfen; die vorhandene Aktion rotiert den Token und macht den bisherigen Link ungültig. Vor dem Anlegen wird die vollständige SMTP-Konfiguration geprüft. Versand und erneuter Versand sind zusammen pro Admin auf fünf pro Minute und fünfzig pro Tag begrenzt; Validierungs- und Einlösungsversuche behalten die IP-basierten Limits.

## SMTP einrichten

1. SMTP-Host, Port, Benutzername und Passwort aus der funktionierenden Vereinswebsite-Konfiguration beim Mailadministrator erfragen. Keine Secrets in Chat, Quellcode oder Logs kopieren.
2. In Vercel unter Project Settings / Environment Variables alle fünf Variablen für die passende Umgebung setzen. Lokal nur die private `.env.local` verwenden; keine `NEXT_PUBLIC_`-Präfixe.

```env
SMTP_HOST=smtp.example.org
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM="Headbang Handwerk e. V. <ramon.meyer@headbang-handwerk.de>"
```

3. Port 465 nutzt implizites TLS; Port 587 erzwingt STARTTLS vor der Authentifizierung. Andere Ports werden abgelehnt. TLS-Zertifikatsprüfung ist aktiv, mindestens TLS 1.2. Selbstsignierte oder ungültige Zertifikate nicht durch Abschalten der Prüfung umgehen; stattdessen den Mailserver reparieren. Verbindungs- und Greeting-Timeout: je 10 Sekunden; Socket-/Versand-Inaktivitätstimeout: 30 Sekunden. SMTP-Debuglogs sind deaktiviert.
4. Der SMTP-Anbieter muss den Absender `ramon.meyer@headbang-handwerk.de` für dieses Konto erlauben. SPF, DKIM und gegebenenfalls DMARC der Domain beim bestehenden Mailanbieter prüfen. Bei Firewall-/Netzwerkproblemen aus Vercel die Erreichbarkeit von 465/587 mit dem Anbieter abstimmen.
5. Nach freigegebenem Deployment eine kontrollierte Testeinladung senden. SMTP-Annahme, Mailserver-/Bounceprotokolle und tatsächliche Zustellung separat prüfen. Diese Änderung versendet keine echten Testmails.

Die HTML-Vorlage bindet das Logo unter `https://<APP-DOMAIN>/E.V.%20Logo.jpeg` ein; daher muss die App-Domain öffentlich per HTTPS erreichbar sein. Der bisherige HTTP-Versandadapter wurde entfernt; `RESEND_API_KEY` und `EMAIL_FROM` werden nicht mehr verwendet. Produktive Secrets wurden nicht geändert. Alte Vercel-Secrets erst nach ausdrücklicher Freigabe und Prüfung anderer Verbraucher entfernen.

Für Invite-URLs wird `NEXT_PUBLIC_APP_URL` bevorzugt, danach `NEXT_PUBLIC_SITE_URL`; ohne beide greift `https://myappschmiede.com`. Produktionslinks erfordern HTTPS und dürfen nicht auf localhost zeigen.

## Bestandskonten-Migration

Vorhandene Profile mit `role: admin` behalten ihre Berechtigung. Andere Benutzerkonten werden nicht automatisch freigeschaltet. Eine geprüfte UID-Allowlist kann mit `scripts/migrate-authorized-users.mjs` migriert werden. Das Skript ist standardmäßig Dry-Run, prüft den Rollenstatus des freigebenden Administrators und übernimmt niemals automatisch alle Profile:

```sh
AUTHORIZED_LEGACY_USER_UIDS='uid1,uid2' \
ACCESS_MIGRATION_APPROVED_BY_UID='verified-admin-uid' \
node --env-file=.env.local scripts/migrate-authorized-users.mjs

AUTHORIZED_LEGACY_USER_UIDS='uid1,uid2' \
ACCESS_MIGRATION_APPROVED_BY_UID='verified-admin-uid' \
node --env-file=.env.local scripts/migrate-authorized-users.mjs --apply
```

Nur manuell geprüfte UIDs eintragen und zuerst den Dry-Run kontrollieren. Die Migration wurde hier nicht ausgeführt.

Ein irrtümlich migrierter Grant kann ohne Profil-, Auth- oder Projektlöschung zurückgenommen werden. Das Skript widerruft ausschließlich explizit aufgelistete `source: legacy_migration`-Grants; Dry-Run ist Standard:

```sh
AUTHORIZED_LEGACY_USER_UIDS='uid1,uid2' \
ACCESS_MIGRATION_APPROVED_BY_UID='verified-admin-uid' \
npm run migration:grants:rollback-dry-run

AUTHORIZED_LEGACY_USER_UIDS='uid1,uid2' \
ACCESS_MIGRATION_APPROVED_BY_UID='verified-admin-uid' \
ACCESS_ROLLBACK_ACK='I_APPROVE_LEGACY_ACCESS_ROLLBACK' \
npm run migration:grants:rollback
```

Widerrufene Grants bleiben als Auditdatensätze erhalten. Es gibt keinen automatischen Rollback bereits eingerichteter SMTP-/Vercel-Variablen oder deployter Firebase-Regeln; diese sind separat anhand des freigegebenen Deployments zurückzusetzen.

### Ersten Administrator einrichten

Für das bestehende Konto kann ein Operator mit Firebase-Admin-Zugang die Auth-UID über die E-Mail-Adresse ermitteln. Das Skript verlangt ein bereits vorhandenes, passendes Profil sowie ein aktiviertes und E-Mail-verifiziertes Auth-Konto. Fehlt das Profil oder stimmt dessen E-Mail nicht überein, bricht es ohne Änderung ab. Es erstellt keine Firebase-Auth-Konten und ändert weder Passwort noch Projekte. Der erste Aufruf ist ausschließlich ein lesender Dry-Run und gibt die tatsächliche UID zur manuellen Gegenprüfung aus:

```sh
BOOTSTRAP_ADMIN_EMAIL='ramon.meyer@hotmail.de' \
BOOTSTRAP_ADMIN_CONFIRM_EMAIL='ramon.meyer@hotmail.de' \
npm run admin:bootstrap:dry-run

BOOTSTRAP_ADMIN_EMAIL='ramon.meyer@hotmail.de' \
BOOTSTRAP_ADMIN_CONFIRM_EMAIL='ramon.meyer@hotmail.de' \
BOOTSTRAP_ADMIN_CONFIRM_UID='uid-from-reviewed-dry-run' \
BOOTSTRAP_ADMIN_ACK='I_APPROVE_ADMIN_ROLE' \
npm run admin:bootstrap:apply
```

Apply setzt ausschließlich `role: admin`, legt bei Bedarf ein aktives `accessGrants`-Dokument an und schreibt einen Auditdatensatz. Ein bereits aktives, passendes Grant wird nicht überschrieben. Rollback stellt die zuvor gespeicherte Rolle wieder her und widerruft nur das vom Skript selbst angelegte Grant. Profil, Firebase-Auth-Konto und Projekte werden nicht gelöscht oder geändert:

```sh
BOOTSTRAP_ADMIN_EMAIL='ramon.meyer@hotmail.de' \
BOOTSTRAP_ADMIN_CONFIRM_EMAIL='ramon.meyer@hotmail.de' \
BOOTSTRAP_ADMIN_CONFIRM_UID='uid-from-reviewed-dry-run' \
npm run admin:bootstrap:rollback-dry-run

BOOTSTRAP_ADMIN_EMAIL='ramon.meyer@hotmail.de' \
BOOTSTRAP_ADMIN_CONFIRM_EMAIL='ramon.meyer@hotmail.de' \
BOOTSTRAP_ADMIN_CONFIRM_UID='uid-from-reviewed-dry-run' \
BOOTSTRAP_ADMIN_ACK='I_APPROVE_ADMIN_ROLLBACK' \
npm run admin:bootstrap:rollback
```

Keiner dieser Bootstrap- oder Rollback-Befehle wurde ausgeführt.

## Firestore-Regeln und Rollout

`firestore.rules` sperrt `accessGrants`, `invitations`, `invitationRateLimits` und `invitationEmailLocks` für Clientzugriffe. Neue Benutzerprofile können nur serverseitig bei Einladungseinlösung geschrieben werden. Projekt-, Vorlagen-, Ticket-, Zeit-, Aufgaben- und Chatdaten erfordern aktives Grant oder Adminrolle. `storage.rules` prüft ebenfalls Grant/Rolle und Projektmitgliedschaft beim Zugriff auf Chat-Dateien.

Rules-Bereitstellung erfolgt separat und nur nach Freigabe:

```sh
firebase deploy --only firestore:rules,storage
```

Rules-Emulatoren lassen sich mit `npm run test:rules` unter dem Demo-Projekt `demo-appschmiede-v2` starten. Die Tests decken Admin, eingeladen, nicht eingeladen, anonym, Rollen-Selbstvergabe, fremde Profile/Projekte und Storage-Projektmitgliedschaft ab. Die Suite wurde lokal ausgeführt; produktive Regeln wurden nicht deployt. Empfohlene Reihenfolge: Admin-UID prüfen und Bootstrap-Dry-Run kontrollieren, ersten Admin nur nach Freigabe setzen, Legacy-UIDs manuell prüfen und Dry-Run ausführen, freigegebene Grants migrieren, Rules in Staging/Emulator prüfen, SMTP/Vercel konfigurieren und erst dann nach Freigabe Regeln und App deployen. Keine dieser Produktionsaktionen wurde hier ausgeführt.

Firestore TTL für `invitationRateLimits.expiresAt` kann aktiviert werden, um alte Rate-Limit-Dokumente zu entfernen; die Berechtigungssicherheit hängt nicht von TTL ab.

## Tests

```sh
npm run test:invitations
npm run test:rules
```

Die Einladungstests prüfen Tokenhash und Tokenzufälligkeit, gültige/ungültige/abgelaufene/widerrufene/eingelöste Einladungen, fehlende Einladungen, E-Mail-Bindung, Adminrollen, E-Mail-Vorlage und escaped persönliche Nachrichten. SMTP-Mocktests prüfen TLS/STARTTLS, Timeouts, fehlende Konfiguration, Authentifizierungs-/Versandfehler, Annahme/Ablehnung und erneuten Versand mit unverändert übernommenem Link. Sie verbinden sich nicht mit echten Mailservern. Die Rules-Suite prüft weiterhin die Firebase-Zugriffssicherheit separat.

## Offene Auditbefunde vor Produktivstart

Next.js wurde von 16.0.7 auf 16.4.3 aktualisiert; damit sind die in dieser Version gemeldeten kritischen Next-Advisories behoben. Der letzte `npm audit --omit=dev`-Lauf meldete 12 Findings (0 kritisch, 4 hoch, 8 moderat). Darunter liegen `firebase-admin`-Advisories, deren vorgeschlagener Fix ein Major-Upgrade auf 14.x ist. `firebase` erhält von npm einen nicht passenden Downgrade-Vorschlag auf 9.14.0; diesen nicht anwenden. Vor Freigabe Firebase-Admin/Firebase-Advisories prüfen, einen kompatiblen Upstream-Fix abwarten oder ein kontrolliertes Major-Upgrade separat planen.

Der vollständige Audit enthält außerdem einen kritischen `tar`-Befund über das Vercel-CLI in `devDependencies`; der Production-Audit enthält diesen nicht. Vercel-CLI wird nicht vom App-Runtime-Code importiert. Vor dem lokalen CLI-Einsatz trotzdem aktualisieren, sobald eine kompatible sichere Version verfügbar ist.

Der Build ist erfolgreich. `npx tsc --noEmit` und projektweites ESLint melden weiterhin bestehende, nicht durch diese Einladungsänderung verursachte Fehler in KI-/Editor-/Stripe-Dateien; der gezielte Lint für Admin-, Mail- und Rule-Testdateien ist sauber.
