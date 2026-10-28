This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## KI: OpenAI / missing_api_key

Der KI-Seitengenerator (`/api/ai/generate-page`) nutzt OpenAI nur, wenn `OPENAI_API_KEY` gesetzt ist.
Wenn der Key fehlt (häufig in Deployments), wird automatisch ein lokales Fallback-Template verwendet und im Editor erscheint ein Hinweis mit `missing_api_key`.

- Lokal: `.env.local` anlegen (siehe `.env.example`) und `OPENAI_API_KEY=...` setzen.
- Vercel: Project → Settings → Environment Variables → `OPENAI_API_KEY` setzen und neu deployen.

### Kostenfreie Editor-Nutzung

Editorfunktionen einschließlich KI sind für autorisierte Mitglieder und Partner kostenfrei. Die gemeinsame Seitenleiste für Desktop, Tablet und Smartphone enthält weder den Kostenkasten noch Preis-, Coin- oder Kostenfrei-Badges. Das gilt auch für integrierte Vorlagen, gespeicherte Seitenvorlagen und gespeicherte App-Vorlagen. Kategorien, Suche, Anwendung der Elemente und Adminfunktionen bleiben erhalten.

Die bisherigen Coin-Abbuchungen lagen in `src/app/api/ai/generate-page/route.ts` und `src/app/api/ai/generate-pages/route.ts` (`chargeCoinsForAction(uid, 'ai')`). Diese Aufrufe sind entfernt. Die Bildgenerierung unter `/api/ai/generate-image` hatte keine Coin-Abfrage. Zusätzlich ist `COIN_COSTS.ai` in `src/config/coins.ts` jetzt wie alle anderen Editoraktionen auf `0` gesetzt, sodass auch der bestehende Billing-Aktionspfad kein Guthaben für diese Aktionen prüft oder abbucht.

`src/lib/access-client.ts` prüft weiterhin die Freischaltung über `/api/access/status`; alle drei KI-Routen behalten `requireAuthenticatedUid(request)` mit Token-, Rollen- und aktiver Grant-Prüfung. Bestehende technische Limits wie Bild-Promptlänge, Bildgröße und Ausgabe-Tokenlimit bleiben unverändert. Separate KI-Rate-Limiter waren in diesen Routen nicht vorhanden und wurden nicht entfernt. Historische Zahlungs- und Guthabendaten sowie die Einladungs- und Administrationsfunktionen bleiben unverändert.

Gezielte Regressionstests: `node --experimental-strip-types --test tests/editor-free-access.test.mjs`.

### Persönliche Daten und Kontosicherheit

Die Profilseite zeigt keine Abonnements oder Zahlungsverwaltung mehr an. Persönliche Daten und die bestehende E-Mail-Änderung bleiben im bisherigen Formular. Darunter öffnen „Passwort ändern“ und „Account löschen“ getrennte, tastaturbedienbare Dialoge.

Für E-Mail/Passwort-Konten prüft die Passwortänderung die Bestätigung und die aktuelle Firebase-Passwortrichtlinie, authentifiziert das aktuelle Passwort erneut und verwendet `updatePassword`. Anschließend wird die App-Sitzung erneuert; ein Fehler dabei wird ausdrücklich als erforderliche Neuanmeldung angezeigt. Andere Anmeldemethoden erhalten einen Hinweis auf die Kontoeinstellungen ihres Anbieters. Passwortfelder sind vom E-Mail-Formular getrennt, bleiben ausschließlich im Arbeitsspeicher und werden beim Schließen geleert.

Die Kontolöschung erfolgt nur nach endgültiger Bestätigung. Passwortkonten authentifizieren sich dazu erneut; andere Anbieter erfordern eine frische Anmeldung. `DELETE /api/account` prüft das Firebase-ID-Token, den bestehenden App-Zugang, eine maximal fünf Minuten alte Authentifizierung und `confirmed: true`. Die Ziel-UID stammt ausschließlich aus dem geprüften Token. Firebase-Konto und eigenes Profildokument werden serverseitig gelöscht, damit die Profilbereinigung nicht an bereits entzogenen Clientrechten scheitert. Ein Fehler nach erfolgreicher Auth-Löschung wird als Teilfehler gemeldet, nicht als vollständiger Erfolg. Das Sitzungscookie wird entfernt und der Client abgemeldet. Projekte, Einladungen und Freigabedokumente werden nicht kaskadierend gelöscht; Rollen- und Zugriffsregeln bleiben unverändert.

Gezielte Tests mit simulierten Firebase-Aufrufen (keine echten Kontolöschungen): `node --experimental-strip-types --test tests/profile-security.test.mjs`.

### Rechtstexte und Vereinsbetrieb

Datenschutzerklärung, AGB, Firebase-Hinweise und öffentliche Hinweise beschreiben die kostenlose, einladungsbasierte Vereinsplattform. Der [Prüfbericht vom 28.10.2026](docs/legal-review-2026-10-28.md) dokumentiert Datenflüsse, sämtliche Änderungen dieses Teilauftrags, Testergebnisse und die vor Veröffentlichung erforderlichen rechtlichen und technischen Freigaben. Die Texte ersetzen keine juristische Prüfung; insbesondere Verträge, Consent, Drittlandübermittlungen, Altzahlungen und Löschprozesse sind nicht allein durch Textänderungen geklärt.

Gezielte Rechtstexttests ohne echte Anbieterzugriffe: `node --test tests/legal-pages.test.mjs`.

Google-Werbung ist vollständig aus der Anwendung entfernt. Die Datenschutzeinstellungen enthalten nur „Essenziell“ und „Analyse“. Firebase Analytics bleibt deaktiviert; der Schalter speichert derzeit lediglich die Auswahl. Alte kombinierte Einwilligungen sind nicht übertragbar und werden neu abgefragt; aktuelle Auswahlen gelten maximal 180 Tage. Eine spätere Analytics-Einführung erfordert neue Informationen und eine neue ausdrückliche Einwilligung. Einzelheiten und Tests: [Datenschutz ohne Werbeintegration](docs/privacy-without-advertising-2026-10-28.md). Regressionstests: `node --test tests/privacy-consent.test.mjs tests/legal-pages.test.mjs`.

### Projekte ohne Tariflimit

Für autorisierte Benutzer gibt es keine künstliche maximale Projektanzahl. Projektgrenzen sind aus Tarifkonfiguration und serverseitiger Billing-Prüfung entfernt; der ältere API-Aktionstyp `assert-project-create` bleibt als reine Zugangsprüfung kompatibel. Historische Tarif-, Coin- und Zahlungsdaten werden nicht geändert. Chat und Zeiterfassung zeigen die vollständige Projektliste statt nur der ersten 50 Einträge. Technische Firestore-/Infrastrukturgrenzen bleiben bestehen.

Die lokalen Firestore-Regeln prüfen Projektlisten anhand des abgefragten Dokuments (`resource.data`), bei unverändert erforderlicher Freischaltung sowie Eigentümer-/Mitglieder-/Administratorprüfung. Die Regelkorrektur wurde ausschließlich im Emulator geprüft und nicht produktiv veröffentlicht. Details, sämtliche Änderungen und Einschränkungen stehen im [Prüfbericht zu Projekten und Startseite](docs/unlimited-projects-2026-10-28.md).

Tests ohne Produktivzugriffe: `node --test tests/unlimited-projects.test.mjs` und `npm run test:rules` (Demo-Emulatoren).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Vercel CLI: direkt kopierbar

Falls du den Deploy lieber per Terminal ausfuhrst, kannst du diese Befehle direkt kopieren.

Erstmalig Projekt mit Vercel verknupfen:

```bash
npm install -g vercel
vercel login
vercel
```

Neuen Preview-Deploy erstellen:

```bash
vercel
```

Direkt auf Production pushen:

```bash
vercel --prod
```

Falls du den aktuellen Code erst zu GitHub pushen willst:

```bash
git add .
git commit -m "Update project"
git push origin main
```

Wenn Vercel bereits mit dem GitHub-Repository verbunden ist, startet der Production-Deploy in der Regel auch automatisch nach dem Push auf `main`.
