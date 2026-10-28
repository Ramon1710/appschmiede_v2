# Rechtstexte und Vereinsbetrieb: Umsetzungs- und Prüfbericht

Stand: 28.10.2026

> Nachtrag: Die nachfolgende Bestandsaufnahme dokumentiert den vorangegangenen Rechtstextauftrag. Die damalige optionale Werbeintegration ist inzwischen vollständig entfernt; Aussagen zu deren Aktivierung und unverändertem Consent-Speicher gelten nicht mehr. Der aktuelle Stand und die zugehörigen Prüfungen stehen im [Entfernungsbericht](./privacy-without-advertising-2026-10-28.md). Die damaligen Testergebnisse bleiben als historische Ergebnisse dokumentiert.

## 1. Ergebnis und Grenzen

Die drei Rechtstexte beschreiben jetzt den kostenlosen, persönlich eingeladenen Zugang für autorisierte Mitglieder und Partner von Headbang Handwerk e. V. Betreiber, Vorstand, Anschrift und Kontakt entsprechen dem Vereinsimpressum. Vereinsregister, Gemeinnützigkeit und Steuernummer bleiben im Impressum; sie wurden nicht undifferenziert in sämtliche Datenschutzabschnitte kopiert.

Die Umsetzung ist ein anhand der Codebasis erstellter Rechtstextentwurf, **keine anwaltliche Freigabe und kein Nachweis einer vollständig datenschutzkonformen Produktivkonfiguration**. Fehlende Verträge, Regionen, Fristen und Kontoeinstellungen werden nicht als vorhanden dargestellt. Die noch erforderlichen Entscheidungen stehen in Abschnitt 8.

Es wurden keine Produktivdatensätze abgefragt oder verändert, keine realen Einladungen verschickt, keine echten KI- oder Zahlungsanforderungen ausgelöst und keine Konten gelöscht. Es gab keinen Commit, Push oder Deployment. Vorherige Arbeitsstände aus den bereits beauftragten Änderungen bleiben erhalten.

## 2. Zusammenfassung der drei Rechtstexte

### Datenschutzerklärung

[Die Datenschutzerklärung](../src/app/datenschutz/page.tsx) hat 15 durchgehend nummerierte Abschnitte:

- Verantwortlicher ist der Verein mit Vorstand, Postanschrift, anklickbarer Kontaktadresse und Vereinswebsite.
- Kostenlose Nutzung einschließlich KI, keine öffentliche Registrierung, kein nutzerseitiger Coin-Verbrauch und keine neuen kostenpflichtigen App-Abonnements.
- Datenkategorien: Profile, UID, Kontaktdaten, Authentifizierung, Rollen und Freigaben, Projekte, Uploads, Einladungen, Sicherheitsdaten, Support, Kommunikation und KI-Eingaben.
- Einladung per SMTP, Hash-Prüfung, sieben Tage Gültigkeit, einmalige Einlösung, E-Mail-Bindung, Status und Missbrauchsschutz. Gültigkeitsende wird ausdrücklich nicht mit automatischer Löschung gleichgesetzt.
- Hosting, tatsächlich eingebundene Firebase-Dienste, Browser-Speicher, bedingt aktiviertes AdSense und tatsächliche Grenzen des Einwilligungsmanagements.
- Externe KI-Dienste einschließlich Pollinations-Fallback, lokale Generierung ohne externen KI-Aufruf sowie externe QR-, Karten-, Video- und Bildabrufe.
- Historische Zahlungsdaten werden ausdrücklich vom aktuellen kostenlosen Angebot getrennt.
- Zweckbezogene Einordnung der Rechtsgrundlagen, Empfänger, Auftragsverarbeitung, mögliche Drittlandübermittlungen, Aufbewahrung, Löschung und Betroffenenrechte.
- Zuständige Aufsicht für den Vereinssitz: Landesbeauftragter für den Datenschutz Niedersachsen, Prinzenstraße 5, 30159 Hannover; Kontakt und Behördenwebsite sind verlinkt.
- Eigener Abschnitt mit offenen Freigabepunkten statt erfundener Vertrags-, Speicher- oder Standortzusagen.

### AGB / Nutzungsbedingungen

[Die AGB](../src/app/agb/page.tsx) haben zwölf neu nummerierte Abschnitte:

- Anbieter, persönlicher Einladungszugang, administrative Freischaltung und Schutz personenbezogener Zugangsdaten.
- Dauerhaft unentgeltliches Nutzungsmodell ohne Coin-Abrechnung, kostenpflichtige App-Tarife oder neue automatische kostenpflichtige Verlängerungen.
- Tatsächliche Projekt-, Editor-, Baustein-, Button-, Vorlagen-, KI-, Vorschau- und Exportfunktionen, ohne universelle Funktions- oder Verfügbarkeitsgarantie.
- Pflichten bei fremden Daten und Inhalten, KI-Fehler, Rechte Dritter und Missbrauchsverbot.
- Rechte an eigenen Projekten und Inhalten sowie zweckgebundene Verarbeitung durch die Plattform.
- Kontolöschung, Ende der Freigabe, Missbrauchssperren und die tatsächlich begrenzte automatische Datenbereinigung.
- Gesetzliche Haftung statt pauschaler Freizeichnung; zwingende Rechte bleiben unberührt.
- Änderungen, anwendbares Recht und ausdrücklich noch zu prüfende rechtswirksame Einbeziehung der Bedingungen.

Frühere Checkout-, Zahlungsrückstands-, Tarifkündigungs- und kostenpflichtige Verlängerungsklauseln sowie eine Befristung der Kostenfreiheit sind entfernt. Es wird nicht behauptet, die vorhandene Registrierung dokumentiere bereits eine wirksame AGB-Annahme.

### Firebase-Hinweise

[Die Firebase-Hinweise](../src/app/datenschutz/firebase/page.tsx) haben elf Abschnitte:

- Firebase Authentication, Cloud Firestore und Firebase Storage als tatsächlich verwendete Produkte.
- Keine behauptete Aktivierung von Firebase Analytics oder Firebase Cloud Messaging allein aufgrund vorhandener Konfigurationsfelder.
- Einladungsnachweis, Firebase-Anmeldung, Freigaben, UID, Profile, Inhalte, Sicherheitsdaten und Uploads.
- Unterscheidung zwischen erfolgreicher Einladungseinlösung und dem anschließenden Setzen von `emailVerified`; kein angeblich separater Verifikationsmailversand.
- Sitzungscookie, clientseitige Authentifizierung, Zugriffsregeln, Dateilinks und Risiken weitergegebener Download-URLs.
- Google als möglicher Auftragsverarbeiter, offene Vertrags-/Regionenprüfung und tatsächliche Löschgrenzen.
- Datenschutzrechte mit Vereinskontakt und Verweis auf die ausführliche Datenschutzerklärung.

## 3. Footer, frühere Preise und Stripe-Seite

- Der gemeinsame [Footer](../src/components/SiteFooter.tsx) enthält Impressum, Datenschutz, AGB, Firebase-Hinweise und Datenschutzeinstellungen. Der Vereinslink bleibt erhalten.
- Der Link „Stripe-Subscriptions“ ist vollständig aus dieser gemeinsamen Komponente entfernt. Da das [Root-Layout](../src/app/layout.tsx) denselben Footer verwendet, betrifft dies auch rechtliche Unterseiten und die responsive Desktop-/Mobilansicht. Eine separate englische Footer-/Rechtstextkomponente wurde nicht gefunden.
- Die alte URL `/stripe-subscriptions` bleibt erreichbar, zeigt aber nur noch einen [Hinweis zu früheren Zahlungsfunktionen](../src/app/stripe-subscriptions/page.tsx). Sie ist kein aktuelles Abonnementangebot und kein Archiv individueller Altverträge. Sie erklärt ausdrücklich, dass die Websiteumstellung weder Daten löscht noch externe Verträge kündigt.
- Die historische Hinweisroute ist mit `noindex, follow` gekennzeichnet und aus der [Sitemap](../src/app/sitemap.ts) entfernt. Keine automatische Weiterleitung wurde eingerichtet: Eine Weiterleitung allein könnte die wichtige Abgrenzung historischer Vorgänge verdecken.
- Falls später ein rechtsverbindliches Vertragsarchiv oder eine andere Zielseite bereitsteht, kann der Verein nach Klärung der Altvorgänge über Entfernung beziehungsweise Weiterleitung entscheiden. Frühere tatsächlich vereinbarte Bedingungen müssen unabhängig von dieser allgemeinen Informationsseite entsprechend den geltenden Pflichten nachweisbar bleiben.
- `/pricing` bleibt unter der bestehenden URL verfügbar, erläutert jetzt aber die [kostenlose Vereinsnutzung](../src/app/pricing/page.tsx) auf Deutsch und Englisch, ohne Tariftabellen, Coin-Kauf oder Zahlungsbuttons.
- Die im aktuellen kostenlosen Modus angezeigten Texte der [Abrechnungsseite](../src/app/tools/billing/page.tsx) versprechen keine spätere Wiederaufnahme von Coin-Käufen mehr.
- Der alte Kontaktlink auf der [Produktseite](../src/app/about/page.tsx) verweist jetzt auf den Verein.
- Verbliebene freie Modelltexte in [Home-Content](../src/lib/home-content.ts) und [PricingPlanAction](../src/components/PricingPlanAction.tsx) behaupten auch auf Englisch keine Coin-Pflicht für KI mehr. Die alte Tarif-Aktionskomponente und die historischen Tarif-/Coin-Datendefinitionen werden von der neuen Preisseite nicht mehr eingebunden; Zahlungsdefinitionen wurden nicht gelöscht.

**Unverändert:** Stripe-Konfiguration, Checkout-, Kündigungs- und Webhook-Endpunkte, historische Benutzer-/Guthabenfelder und bestehende Datensätze. Der bestehende kostenlose Modus blockiert neuen Checkout bereits vor einem Stripe-Aufruf mit HTTP 403. Kündigung und signaturgeprüfter Webhook bleiben technisch vorhanden. Ob produktiv frühere Abonnements existieren oder weiter abgerechnet werden, wurde nicht aus Code oder fehlenden neuen Checkout-Angeboten abgeleitet und muss der Betreiber gesondert klären.

## 4. Tatsächliche Dienste und Datenflüsse

„Implementiert“ bedeutet hier: Ein entsprechender ausführbarer Codepfad ist vorhanden. Es ist kein Beleg für die Aktivierung, den Vertragsinhaber oder konkrete Datensätze in einer Produktivumgebung. Eine Umgebungsvariable oder ein Platzhalter allein wird nicht als aktive Integration gewertet.

| Dienst / Mechanismus | Beleg und Verwendung | Übermittelte / gespeicherte Daten | Einordnung und noch fehlender Nachweis |
|---|---|---|---|
| Vercel | Bereitstellungsziel und Hostingkontext des Next.js-Projekts | HTTP-Verbindungsdaten, angeforderte Ressourcen; mögliche Betriebs-/Fehlerprotokolle | Sicherheit/Betrieb zweckbezogen Art. 6 Abs. 1 lit. f DSGVO. Produktives Projekt, Auftragsverarbeitung, Empfänger, Regionen, Protokollumfang und Fristen nicht aus dem Repository verifizierbar. |
| Firebase Authentication | [Firebase-Initialisierung](../src/lib/firebase.ts), [Server-Auth](../src/lib/server-auth.ts), [Einladungseinlösung](../src/app/api/invitations/redeem/route.ts) | UID, E-Mail, Authentifizierungs-/Sitzungsdaten; Passwortverarbeitung durch Firebase | Kontobetrieb regelmäßig Art. 6 Abs. 1 lit. b, Sicherheitsverarbeitung lit. f DSGVO; Google-Vertragsrolle und Übermittlungsgrundlagen konkret bestätigen. Kein Nachweis bestimmter Produktionsregionen oder Löschfristen. |
| Cloud Firestore | Profile, Projekte, Rollen/Grants, Einladungen, Ratenzähler, Aufgaben, Chats und Support | Inhalts- und Metadaten einschließlich zugeordneter UIDs/E-Mail-Adressen | Nutzungszweck regelmäßig Art. 6 Abs. 1 lit. b; Sicherheit lit. f DSGVO. Daten Dritter erfordern einen eigenen rechtmäßigen Verarbeitungsgrund. Konkrete Aufbewahrung und Google-Vertrag offen. |
| Firebase Storage | [Chat-Uploads](../src/app/tools/chat/page.tsx), [Storage-Initialisierung](../src/lib/storage.ts), Storage-Regeln | Dateien, Dateinamen/-pfade und Download-URLs | Betrieb der gewünschten Uploadfunktion; Zugriffs- und Weitergaberisiken beachten. Bucket-Region, Verträge und endgültige Bereinigung einschließlich Backups offen. |
| SMTP / Nodemailer | [SMTP-Client](../src/lib/smtp-client.ts), [Einladungsserver](../src/lib/invitation-server.ts) | Eingeladene E-Mail, Einladungslink, optionale persönliche Nachricht, Versandstatus/Message-ID | Persönliche Einladung und Schutz vor Missbrauch zweckbezogen, insbesondere Art. 6 Abs. 1 lit. f DSGVO; tatsächlicher Versender, Vertrag, Speicherorte und Fristen unbekannt. Keine Schlussfolgerung auf einen Anbieter aus erfundenen Umgebungswerten. |
| Google AdSense (damaliger Stand, inzwischen entfernt) | Ehemaliger Loader im Root-Layout und Consent-Helfer | Damals mögliche Browserverbindung zu Google, Kennungen und Werbedaten | Diese Integration wurde im Folgeauftrag vollständig entfernt; siehe Entfernungsbericht. |
| OpenAI | [Seitengenerierung](../src/app/api/ai/generate-page/route.ts): `gpt-4o-mini`; [Bildgenerierung](../src/app/api/ai/generate-image/route.ts): `gpt-image-1` | Eingabe-Prompt, je nach Route Seitenname/Kontext; generierte Antworten/Bilder. Kein automatischer Versand der gesamten Projektdatenbank in diesen Routen. | Auf Wunsch des Nutzers ausgeführte Funktion, Rechtsgrundlage und zulässige Eingaben gesondert bewerten. Organisationsvertrag, Trainings-Opt-in, Protokollierung, Aufbewahrung und Drittlandgarantien nicht verifiziert. |
| Pollinations | Fallback der Bildgenerierung | Serverabruf einer URL mit kodiertem, gekürztem Prompt im URL-Pfad | Auch ein Fallback ist eine externe Übermittlung. Anbieteridentität, Trainings-/Speicherregeln, Vertragsrolle und Drittlandgrundlage nicht bestätigt. Kein pauschales „keine KI-Datenspeicherung“. |
| QR Server / `api.qrserver.com` | Editor, [QR-Werkzeug](../src/app/tools/qr/page.tsx), Vorschau | Browserseitig kodierter QR-Inhalt im URL-Parameter, Verbindungsdaten; bei Projektlinks möglicherweise Projektkennung | Kein rein lokaler QR-Generator. Keine pauschale Einwilligungssperre im bestehenden Code. Geeignete Rechtsgrundlage, Empfänger, Fristen und Umgang mit vertraulichen URLs klären. |
| Google Maps | Editor- und [Vorschau-Canvas](../src/app/preview/PreviewCanvas.tsx) | Kartenanfrage, Ortsdaten und Browser-Verbindungsdaten; mögliche weitere Anbieterzugriffe | Iframe nicht generell an globale Consent-Auswahl gebunden. Rechtsgrundlage, Gerätezugriffe, Transfers und notwendiges Laden nach Einwilligung prüfen. |
| YouTube / `img.youtube.com` | Video-Iframe beziehungsweise Vorschaubild | Video-ID, Browser-Verbindungsdaten und gegebenenfalls weitere Anbieterinformationen | Vorhandene externe Medienabrufe sind nicht pauschal blockiert. Zustimmungen und Anbieter-/Transferinformationen noch prüfen. |
| `images.unsplash.com`, `placehold.co`, eigene Medien-URLs | Bilder, Beispiel-/Platzhalterinhalte und nutzerbestimmte URLs in Editor/Vorschau | Browser-Verbindungsdaten, URL und mögliche Referrerinformationen | Anbieter und Übermittlung hängen von der jeweiligen URL ab; kein allgemeiner Nachweis von Auftragsverarbeitung, Rechtsgrundlage, Einwilligung oder Frist. |
| Stripe, historisch | [Checkout](../src/app/api/stripe/checkout/route.ts), [Kündigung](../src/app/api/stripe/cancel-subscription/route.ts), [Webhook](../src/app/api/stripe/webhook/route.ts), bestehende Billing-Typen | Potenziell historische Kunden-, Abo-, Zahlungs- und Ereignisreferenzen | Kein aktuelles kostenpflichtiges Angebot. Frühere Verträge/Ansprüche und gesetzliche Pflichten sind gesondert zu prüfen, gegebenenfalls Art. 6 Abs. 1 lit. b, c oder f DSGVO. Keine produktive Bestandsprüfung durchgeführt. |

### Nicht als aktive Dienste festgestellt

- Kein initialisiertes Firebase Analytics, kein eigenständiges Google-Analytics-Skript und kein initialisiertes Firebase Cloud Messaging / Push-Token-Verfahren gefunden. Mess-ID, Messaging-Sender-ID oder VAPID-Platzhalter beweisen keine aktive Verarbeitung.
- Die interne [Analyseseite](../src/app/tools/analytics/page.tsx) zählt eigene Firestore-Datensätze; sie ist nicht mit Google Analytics gleichzusetzen.
- Kein Anthropic-Aufruf trotz vorhandener Konfigurationsmöglichkeiten gefunden.
- [Mehrseitengenerierung](../src/app/api/ai/generate-pages/route.ts) arbeitet lokal; ihr API-Name allein begründet keinen externen KI-Datenfluss.
- Browser-Mikrofonfunktionen benötigen eine Gerätefreigabe. Diese ersetzt nicht automatisch die Prüfung der datenschutzrechtlichen Grundlage einer späteren Inhaltsverarbeitung.
- Ein externer Website-Link wird nicht als automatisch aktiver Trackingdienst behandelt. In exportierten Apps müssen Betreiber deren konkrete Inhalte und Drittanbieter gesondert bewerten.

### KI und Training

Die offizielle OpenAI-API-Dokumentation unterscheidet Trainingsnutzung, Missbrauchsprotokolle, produktabhängige Speicherung und besonders freizugebende Aufbewahrungskontrollen. Die allgemeine Aussage, API-Daten würden standardmäßig nicht zum Training verwendet, ersetzt weder einen Vertrag noch einen Nachweis der tatsächlichen Organisations-/Produkteinstellungen. Für die AppSchmiede wurde deshalb kein pauschales Trainingsverbot, keine Zero-Data-Retention-Zusage und keine feste Löschfrist behauptet. Für Pollinations liegen hier keine ausreichend bestätigten vertragsbezogenen Angaben vor.

KI-Antworten können in Projektinhalte übernommen und dann in Firestore gespeichert werden. Anbieterfehler werden in vorhandenen Routen teilweise protokolliert; eine ausnahmslos inhaltsfreie Fehlerprotokollierung wird deshalb nicht zugesichert. Prompts sollten keine unzulässig übermittelten persönlichen Daten, Geheimnisse oder Zugangsdaten enthalten.

## 5. Einladungen, Zugriff und Löschung

### Einladung und Anmeldung

- Zufälliger persönlicher Token mit SHA-256-Hash in Firestore; die E-Mail enthält naturgemäß den einlösbaren Link.
- Sieben Tage Gültigkeit, Statusprüfung, feste eingeladene E-Mail, einmalige transaktionale Einlösung sowie Rotation bei erneutem Versand.
- Speicherung von eingeladenen Adressen, erstellenden Administratoren, Status-/Versandzeitpunkten, Versandresultaten und zugeordnetem Benutzerkonto.
- E-Mail-Sperrdokumente verhindern doppelte offene Einladungen. Ratenzähler binden Aktionen an gehashte IP-/UID-Bezüge und Zeitfenster.
- Ein `expiresAt`-Feld ist noch kein Beleg für eine aktivierte Firestore-TTL-Löschung.
- Freigabe über aktive `accessGrants` oder gespeicherte Administratorrolle; keine öffentlichen regulären Benutzerregistrierungen.
- Nach erfolgreicher Einlösung wird die Firebase-E-Mailbestätigung zusätzlich bestmöglich gesetzt. Dies ist ein nachgelagerter Schritt und keine unabhängig versandte Bestätigungs-E-Mail.

Tokenprüfung, SMTP-Schutz, Rechte, Freigaben und Ratenbegrenzungen wurden in diesem Rechtstextauftrag nicht verändert.

### Tatsächliche Löschgrenzen

Die vorhandene [Kontolöschung](../src/app/api/account/route.ts) prüft Autorisierung, ausdrückliche Bestätigung und eine höchstens fünf Minuten alte Authentifizierung. Sie löscht das Firebase-Auth-Konto und das eigene Profildokument und entfernt die App-Sitzung. Teilfehler werden gemeldet.

Sie löscht **nicht** automatisch sämtliche Projekte, Seiten, Uploads, Chats, Tickets, Einladungen, Grants oder historischen Zahlungsinformationen. Auch Projektlöschung ist kein Nachweis einer vollständigen Bereinigung aller abhängigen Dateien/Dokumente. Eine rechtlich belastbare Löschzusage erfordert daher noch einen definierten Betriebsprozess mit Verantwortlichen, Fristen, Ausnahmen und Nachkontrolle.

## 6. Cookies, Browser-Speicher und Consent

| Mechanismus | Nachgewiesenes Verhalten | Grenze / Freigabebedarf |
|---|---|---|
| `__session` | HttpOnly, SameSite=Lax, Secure in Produktion, maximal fünf Tage | Serverzugriff und Abmeldung beachten; Firebase-Sitzungen/Tokens haben daneben eigene Mechanismen. |
| Firebase-Auth-Persistenz | SDK-Anmeldung, keine explizite Umstellung der Standardpersistenz gefunden | Verwendeten lokalen Speicher und tatsächliche Token-/Sitzungslebensdauer produktbezogen bestätigen. Die Anwendung speichert keine Passwortfelder in Firestore oder Browser-Storage. |
| `appschmiede_privacy_consent` | Cookie maximal 180 Tage; gleiche Auswahl zusätzlich in localStorage | localStorage hat keine automatische Befristung; Formatprüfung vergleicht Versionsstand und Alter nicht mit der aktuellen Vorgabe. Kein zentraler Nachweis einer Einwilligung implementiert. |
| `lang` | Sprachcookie ungefähr ein Jahr sowie lokale Spracheinstellung | Komfortspeicherung und Erforderlichkeit nach TDDDG prüfen; kein pauschaler Freibrief als „technisch notwendig“. |
| Editor-/Projekt-/Tour-Einstellungen | Lokale Layout-, zuletzt gewählte Projekt- und Tour-Zustände | Keine automatische Frist in den gefundenen Speicherhelfern; Erforderlichkeit, Löschung bei Abmeldung und Dokumentation prüfen. |
| AdSense-Auswahl | Eine kombinierte Kategorie „Analyse und Werbung“, initial aus; Nachladen nur bei Flag und Zustimmung; erneute Einstellungen über Footer | Keine festgestellte zertifizierte CMP-/Google-Consent-Mode-Integration. Deaktivieren der React-Komponente entfernt geladene Skripte und Cookies nicht zuverlässig. Nicht als vollständig konformes Widerrufsverfahren darstellen. |
| Externe Medien | QR, Maps, Video und Bildquellen abhängig vom Element direkt abrufbar | Keine universelle Kopplung an das Banner; Ablehnung dieser Kategorie blockiert nicht sämtliche Drittanbieter. |

Die Texte des [Consent-Banners](../src/components/ConsentBanner.tsx) wurden diesen Befunden angepasst. Kategorie, gespeicherte Auswahl, Eventmechanismus und AdSense-Loader wurden nicht umgebaut. Eine Textkorrektur behebt die benannten technischen Grenzen nicht.

## 7. Geänderte Dateien dieses Teilauftrags

| Datei | Änderung |
|---|---|
| [Datenschutz](../src/app/datenschutz/page.tsx) | Vollständiger neuer Rechtstext, konkrete Datenflüsse und offene Punkte |
| [AGB](../src/app/agb/page.tsx) | Kostenlose Einladungsplattform, neue Gliederung, Rechte und Haftung |
| [Firebase-Hinweise](../src/app/datenschutz/firebase/page.tsx) | Tatsächliche Dienste, Einladung, Zugriff und Löschung |
| [SiteFooter](../src/components/SiteFooter.tsx) | Stripe-Link entfernt, sachlich korrekter Hinweistext |
| [ConsentBanner](../src/components/ConsentBanner.tsx) | Unzutreffende Analytics-/Push-Aussagen ersetzt, Datenschutzlinks und Grenzen erklärt |
| [LegalPageShell](../src/components/LegalPageShell.tsx) | Wortumbruch für schmale Ansichten; Dark-Mode, Abstände und Breakpoints bleiben erhalten |
| [PricingPage](../src/app/pricing/page.tsx) | Kostenlose Vereinsnutzung statt veralteter Tarifdarstellung, Deutsch/Englisch |
| [StripeSubscriptionsPage](../src/app/stripe-subscriptions/page.tsx) | Historischer Hinweis statt aktueller Zahlungsbedingungen, `noindex` |
| [Sitemap](../src/app/sitemap.ts) | Nicht indexierbare historische Stripe-Seite entfernt |
| [AboutPage](../src/app/about/page.tsx) | Kontaktadresse auf Verein umgestellt |
| [BillingPage](../src/app/tools/billing/page.tsx) | Aktueller kostenfreier Hinweis ohne Kauf-Wiederaufnahmeversprechen, Deutsch/Englisch |
| [PricingPlanAction](../src/components/PricingPlanAction.tsx) | Kostenfreier Modus ohne widersprüchliche KI-Coin-Aussage, Deutsch/Englisch |
| [Home-Content](../src/lib/home-content.ts) | Verbliebene freie Modelltexte korrigiert, Deutsch/Englisch |
| [Rechtstexttests](../tests/legal-pages.test.mjs) | 14 neue gezielte Tests, ohne echte Provider-/Kontozugriffe |
| [README](../README.md) | Verweis auf diesen Bericht und Testkommando |
| [Dieser Bericht](./legal-review-2026-10-28.md) | Geforderte Dokumentation von Änderungen, Belegen, Tests und Freigabepunkten |

Andere bereits im Arbeitsverzeichnis vorhandene Änderungen, etwa an Startseite, Editor, Profil und Impressum, stammen aus vorherigen Teilaufträgen. Der aktuelle Auftrag hat weder deren Arbeit zurückgesetzt noch Zahlungs-, Authentifizierungs- oder Einladungslogik verändert.

## 8. Vor Veröffentlichung verbindlich klären

1. **Verantwortung und Verträge:** Vereinsvorstand muss die Betreiberangaben und rechtliche Verantwortlichkeit freigeben. Tatsächliche Kontoinhaber und Vertragsparteien von Vercel, Google/Firebase, SMTP, OpenAI und gegebenenfalls weiteren Anbietern feststellen. Erforderliche Vereinbarungen nach Art. 28 DSGVO tatsächlich abschließen beziehungsweise belegen; Vertragsvorlagen allein reichen nicht.
2. **Drittlandübermittlungen:** Konkrete Regionen, Unterauftragsverarbeiter, Übermittlungswege und geeignete Garantien nach Art. 44 ff. DSGVO für die tatsächlich eingesetzten Produkte und Vertragsparteien prüfen. Keine pauschale EU-Hosting-Zusage aus SDK-Konfiguration ableiten.
3. **SMTP und Einladungsinformation:** Anbieter, Transport-/Archivierungspraxis, Löschfristen, Absenderkonfiguration und gegebenenfalls Informationen nach Art. 14 DSGVO für eingeladene Personen festlegen. Herkunft und Berechtigung der eingeladenen Adressen prüfen.
4. **KI-Freigabe:** OpenAI-Organisation, Produktverträge, Opt-ins, Aufbewahrungskontrollen, Logging und zulässige Eingabekategorien bestätigen. Pollinations nur mit belastbarer Anbieter-/Transfer-/Speicherprüfung freigeben oder in einem gesonderten technischen Auftrag deaktivieren/ersetzen.
5. **Werbung und Consent:** Tatsächliches AdSense-Produktivflag klären. Falls Werbung gewünscht ist, Einwilligungszwecke, CMP-Anforderungen, Widerruf, Nachweis, Fristen und Versionserneuerung technisch und rechtlich überarbeiten. Bestehende Einwilligungen nicht ungeprüft auf geänderte Informationen/Purposes übertragen.
6. **Externe Medien und lokaler Komfortspeicher:** Notwendigkeit und Rechtsgrundlage je Datenfluss prüfen; bei Bedarf echte Vorabblockierung, Einzelladefreigabe oder lokale Alternativen beauftragen. Sprach-/Editor-/Tour-Speicher nicht allein per Text pauschal für notwendig erklären.
7. **Aufbewahrung und Löschung:** Verzeichnis tatsächlicher Datenkategorien, nachvollziehbare Fristen und gesetzliche Ausnahmen festlegen. Einladungssperren, Ratenzähler, Profile, Grants, Projekte, Dateien, Chats, Support, Protokolle, Backups und Altzahlungen berücksichtigen. Produktive TTL-Konfiguration und endgültige Bereinigung verifizieren.
8. **Kontolöschung und Projektübergabe:** Prozess für verwaiste Projekte/Dateien, gemeinsame Projekte, Fristabläufe, manuelle Bereinigung, Rechteanfragen und Wiederherstellungen festlegen. Die aktuelle Zwei-Schritt-Löschung darf nicht als vollständiges „Recht auf Vergessenwerden“ verkauft werden.
9. **Historische Stripe-Vorgänge:** Ohne neue Checkout-Angebote können frühere Verträge weiterbestehen. Produktivbestand, weitere Abbuchungen, Kündigungen, Erstattungen, Belegzugang, Aufbewahrung und alte tatsächlich vereinbarte Bedingungen gesondert prüfen; nichts automatisch löschen oder kündigen.
10. **AGB und Leistungsaussagen:** Unentgeltliche Vereinsnutzung, Einbeziehung/Annahme, Änderungsverfahren, Sperrungen, Haftung, Rechte an Inhalten und exportierten Apps juristisch freigeben. Der vorhandene Registrierungsprozess beweist noch keine rechtswirksame AGB-Annahme.
11. **Weitere Datenschutzorganisation:** Datenschutzbeauftragtenpflicht, Datenschutz-Folgenabschätzung, Verarbeitungsverzeichnis, TOMs, Rechteauskunft und Vorfallmanagement anhand des tatsächlichen Betriebs beurteilen; keine Bestellung oder Ausnahme erfinden.
12. **Produktiv-/Geräteabnahme:** Tatsächliche Browser-Netzwerkabrufe und Speicherungen bei Zustimmung, Ablehnung und Widerruf sowie die Darstellung auf realen Desktop-, Tablet- und Smartphone-Browsern prüfen. Die automatisierte Strukturprüfung ersetzt diesen Test nicht.

## 9. Testergebnisse

### Automatisierte Regressionstests

Ausgeführt:

```bash
node --test tests/legal-pages.test.mjs tests/editor-free-access.test.mjs tests/profile-security.test.mjs tests/invitation-core.test.mjs tests/smtp-client.test.mjs
```

**Ergebnis: 61 Tests erfolgreich, 0 fehlgeschlagen.** Davon sind 14 neue Rechtstext-/Footer-/Pricing-/Zugriffstests. Geprüft werden unter anderem Betreiberkonsistenz, vollständige Nummerierung, Datum, Mailto-Verlinkung, lokale Linkziele, sichere externe Linkattribute, konkrete Datenschutzangaben, Entfernung alter Zahlungsbedingungen, Footer-Linkmenge, deutsche/englische Preisersatztexte, historischer Hinweis, Checkout-Sperre und abgelehnte nicht autorisierte Sitzungen.

Bestehende Tests prüfen weiterhin Editoraktionen ohne Coin-Verbrauch, Kategorie-/Such-/Anwendungsfunktionen, Profil-Passwortwechsel und Löschbestätigung, Einladungsvalidierung, Administratorrollen und SMTP-Schutz. Erwartete simulierte Löschfehler erzeugen dabei bewusst sichere Fehlermeldungen; es wurden keine echten Benutzer oder Nachrichten verarbeitet. Die Auswahl ist kein Nachweis für eine fehlerfreie gesamte Repository-Testsuite.

### Lokaler Produktions-Smoke-Test

Nach dem Build wurde vorübergehend ein nur lokal gebundener Produktionsserver gestartet und anschließend wieder beendet:

- HTTP 200 für `/datenschutz`, `/agb`, `/datenschutz/firebase`, `/impressum`, `/pricing`, `/about`, `/stripe-subscriptions`, `/login`, `/register` und `/invite`.
- Auf allen zehn Antworten: vier bestehende rechtliche Footer-Linkziele, kein Stripe-Subscriptions-Link.
- Rechtstexte mit aktuellem Datum und ohne alte Einzelunternehmeranschrift/-kontaktadresse.
- Englischer Sprachcookie liefert die kostenlose englische Nutzungsbeschreibung auf `/pricing`.
- Historische Stripe-Seite liefert `noindex, follow`; Sitemap enthält diese URL nicht mehr.
- Nicht angemeldete Anfragen an `/dashboard`, `/editor` und `/profile` signalisieren weiterhin die Umleitung nach `/login`. Next.js liefert dabei einen gestreamten HTTP-200-Rahmen mit `NEXT_REDIRECT;replace;/login;307;`, nicht zwingend einen HTTP-307-Header. Der Rauchtest berücksichtigt dieses tatsächliche Protokoll.

Es wurde keine echte Anmeldung, kein vollständiger Browser-Einladungsablauf und kein Provider-/Zahlungsvorgang ausgeführt.

### Lint, Typen, Build und Layout

- **Produktionsbuild:** `npm run build` erfolgreich.
- **Wichtig:** Die vorhandene Next.js-Konfiguration überspringt Typfehler beim Build. Ein erfolgreicher Build ist daher kein sauberer Typcheck.
- **Separater Typcheck:** `npx tsc --noEmit --incremental false` meldet weiterhin 35 Diagnosen in bestehenden Editor-/Preview-/Stripe-Typbereichen. Keine Diagnose betrifft die für diesen Rechtstextauftrag geänderten TypeScript-Dateien.
- **Gezielter ESLint-Lauf:** Neue Rechtstexte, Footer, Shell, Preisersatzseite, historische Hinweisroute, Sitemap, Kontaktseite, Pricing-Aktionskomponente, Home-Content und neuer Test ohne Meldungen.
- **Bereits vorhandene ESLint-Probleme:** Billing-Seite `react-hooks/immutability` und Consent-Banner `react-hooks/set-state-in-effect`. Regeln und Meldungen wurden mit dem Stand in `HEAD` verglichen und sind unverändert; sie wurden nicht als sachfremde Reparatur mitgeändert.
- **Whitespace:** `git diff --check` erfolgreich.
- **Responsive Struktur:** Gemeinsame schmale Inhaltsbreite, mobile Abstände, vorhandene `sm`-/`lg`-Breakpoints, umbrechende Footer-Navigation und zusätzlicher Wortumbruch im Legal-Shell geprüft. Dark-Mode-Farben bleiben erhalten. Keine visuelle Geräte-/Browserabnahme behauptet; Browserautomation und Browserprogramme waren nicht verfügbar.
- **Unveränderte sensible Mechanismen:** Git-Diff-Prüfung zeigt keine Änderungen an Stripe-Endpunkten/-Konfiguration, Billing-Server, Server-Auth, Einladungsendpunkten/-server, Firebase-Initialisierung, Firestore-/Storage-Regeln, AdSense-Loader oder Consent-Speicherhelfer.

## 10. Öffentlich herangezogene Quellen

Abruf-/Recherchezeitpunkt: 28.10.2026. Anbieterinformationen belegen nur deren allgemeine Dokumentation, nicht den Abschluss eines Vertrags oder Einstellungen dieser AppSchmiede-Instanz.

- [Firebase: Privacy and Security](https://firebase.google.com/support/privacy)
- [OpenAI API: Your data](https://developers.openai.com/api/docs/guides/your-data)
- [Vercel: Data Processing Addendum](https://vercel.com/legal/dpa)
- [Landesbeauftragter für den Datenschutz Niedersachsen](https://www.lfd.niedersachsen.de/)
- [BfDI-Verzeichnis der Aufsichtsbehörden: Niedersachsen](https://www.bfdi.bund.de/SharedDocs/Adressen/DE/LfD/Niedersachsen.html) zur Behördenzuordnung recherchiert; der direkte Seitenabruf war zugriffsbeschränkt.

Verwendete Gesetzesbezeichnungen: DSGVO, DDG, TDDDG und MStV. Die Texte sagen keine rechtliche Freigabe zu. Direkte Abrufe einzelner Gesetzesseiten sowie belastbare vertragsbezogene Nachweise zu Pollinations/QR-Diensten standen hier nicht vollständig zur Verfügung; die offenen Prüfungen bleiben ausdrücklich bestehen.
