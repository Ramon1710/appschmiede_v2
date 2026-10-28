import Link from 'next/link';
import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import PrivacySettingsButton from '@/components/PrivacySettingsButton';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzhinweise zur kostenlosen, einladungsbasierten AppSchmiede von Headbang Handwerk e. V.',
};

export default function Datenschutz() {
  return (
    <LegalPageShell title="Datenschutzerklärung" subtitle="AppSchmiede für autorisierte Mitglieder und Partner von Headbang Handwerk e. V." updatedAt="28.10.2026">
      <section>
        <h2>1. Verantwortlicher und Kontakt</h2>
        <p>
          Headbang Handwerk e. V.<br />
          Wiesengrund 5<br />
          26203 Wardenburg<br />
          Deutschland
        </p>
        <p>Vertreten durch den Vorstand: Daniel Bigl, Ramon Meyer und Melanie Stephan.</p>
        <p>
          Datenschutzanfragen: <a href="mailto:info@headbang-handwerk.de" className="underline decoration-dotted">info@headbang-handwerk.de</a><br />
          Vereinswebsite: <a href="https://www.headbang-handwerk.com/" target="_blank" rel="noopener noreferrer" className="break-words underline decoration-dotted">https://www.headbang-handwerk.com/</a>
        </p>
        <p>Weitere Vereinsangaben stehen im <Link href="/impressum" className="underline decoration-dotted">Impressum</Link>.</p>
      </section>

      <section>
        <h2>2. Angebot, Zwecke und Rechtsgrundlagen</h2>
        <p>AppSchmiede ist eine vollständig kostenlose Plattform für freigeschaltete Mitglieder und Partner des Vereins. Es gibt keine öffentliche Registrierung; neue Zugänge werden durch persönliche Einladungen eingerichtet. Es werden keine nutzerseitigen Coins abgerechnet, keine kostenpflichtigen Mitgliedertarife oder App-Abonnements angeboten und keine automatischen kostenpflichtigen Verlängerungen neu vereinbart.</p>
        <p>Wir verarbeiten Daten zur Einladung, Anmeldung, Verwaltung von Profilen und Zugangsrechten, Bearbeitung von Projekten, Kommunikation sowie für die technische Sicherheit. Für die Bereitstellung des angefragten Zugangs und der vereinbarten Funktionen dient Art. 6 Abs. 1 lit. b DSGVO als Grundlage. Für notwendige Sicherheits- und Missbrauchsschutzmaßnahmen sowie die Bearbeitung sonstiger Anfragen kommt Art. 6 Abs. 1 lit. f DSGVO in Betracht; berechtigte Interessen sind ein sicherer Vereinsbetrieb und der Schutz der Beteiligten. Gesetzliche Pflichten werden auf Art. 6 Abs. 1 lit. c DSGVO gestützt. Optionale, einwilligungsbedürftige Verarbeitungen erfordern Art. 6 Abs. 1 lit. a DSGVO.</p>
        <p>Welche Grundlage für eine konkrete Verarbeitung gilt, hängt von deren Zweck ab. Eine Mitgliedschaft oder Einladung ist keine pauschale Einwilligung in Werbung, Tracking oder die Weitergabe beliebiger personenbezogener Inhalte an KI-Dienste.</p>
      </section>

      <section>
        <h2>3. Verarbeitete Daten und erforderliche Angaben</h2>
        <ul>
          <li>Kontaktdaten und Profilangaben: E-Mail-Adresse, angezeigter Name sowie freiwillig ergänzte Vor- und Nachnamen, Unternehmen und Telefonnummer.</li>
          <li>Kontodaten: Firebase-UID, Anmeldemethode, Authentifizierungs- und Sitzungsdaten, Zeitstempel sowie Administratorrolle und Zugangsfreigabe.</li>
          <li>Einladungsdaten: Ziel-E-Mail-Adresse, Token-Hash, Ablauf-, Versand- und Einlösestatus, einladende Administration und Zuordnung zum eingelösten Konto.</li>
          <li>Projekt- und Anwendungsdaten: Projekte, Seiten, Layouts, Vorlagen, Inhalte, Einstellungen, Bearbeitungsinformationen und gegebenenfalls hochgeladene Dateien.</li>
          <li>Kommunikationsdaten: Supportanfragen, Projekt-Chatnachrichten, Anhänge, Absenderkennungen und Bearbeitungsstatus, soweit die entsprechenden Funktionen genutzt werden.</li>
          <li>Technische Daten: IP- und Verbindungsdaten, Browserinformationen, Sicherheitszähler, Fehlermeldungen sowie bei Nutzung von KI die eingegebenen Beschreibungen und erzeugten Ergebnisse.</li>
        </ul>
        <p>Eine eingeladene E-Mail-Adresse und Authentifizierungsdaten sind für den persönlichen Zugang erforderlich. Ohne sie können wir kein freigeschaltetes Konto bereitstellen. Zusätzliche Profilfelder sind für die Registrierung nicht verpflichtend. Bitte geben Sie nur die für Ihren Zweck erforderlichen Daten ein und keine fremden oder besonders sensiblen personenbezogenen Daten ohne geeignete Berechtigung und Rechtsgrundlage.</p>
      </section>

      <section>
        <h2>4. Persönliche Einladungen und E-Mail-Versand</h2>
        <p>Die Administration hinterlegt die eingeladene E-Mail-Adresse und versendet einen persönlichen Link über den konfigurierten SMTP-Mailserver. Die Nachricht enthält den Zugangslink und gegebenenfalls eine persönliche Nachricht. Empfänger sind der Mailserverbetreiber und die beteiligten Empfangs-Maildienste. Die Verbindung zum Versandserver ist verschlüsselt; daraus folgt keine Ende-zu-Ende-Verschlüsselung der E-Mail.</p>
        <p>Einladungen sind sieben Tage gültig und nur einmal einlösbar. Die Datenbank speichert den SHA-256-Hash des zufälligen Tokens, nicht dessen Klartext. Der persönliche Link selbst wird für den Versand verarbeitet. Bei Prüfung und Einlösung werden Gültigkeit, Status, Frist und die Übereinstimmung der Konto-E-Mail mit der Einladung geprüft. Nach Einlösung werden die Firebase-UID, Einlösezeit und aktive Zugangsfreigabe zugeordnet. Erneuter Versand erzeugt einen neuen Link und macht den bisherigen offenen Link ungültig.</p>
        <p>Der Besitz des an die eingeladene Adresse versandten Links dient als E-Mail-Nachweis. Nach erfolgreicher Einlösung wird die E-Mail-Adresse in Firebase administrativ als bestätigt markiert; eine zusätzliche Firebase-Verifizierungsmail ist in diesem Ablauf nicht vorgesehen. Bei einem Fehler dieses nachgelagerten Bestätigungsschritts kann die bereits eingerichtete Freigabe bestehen bleiben.</p>
        <p>Versandstatus, Zeitstempel, bereinigte Fehlercodes und die vom Mailserver bestätigte Message-ID unterstützen Verwaltung und Fehlerbehandlung. Eine SMTP-Annahme bestätigt keine tatsächliche Zustellung. Missbrauchsschutz verwendet begrenzte Versuche, transaktionale Einmal-Einlösung und gehashte, aktionsbezogene IP- beziehungsweise Administratorkennungen mit Zählern. Die Ablaufmarkierung dieser Zähler ist kein Nachweis einer aktivierten automatischen Datenlöschung.</p>
        <p>Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b DSGVO für den angefragten Zugang beziehungsweise Art. 6 Abs. 1 lit. f DSGVO für die berechtigte Einladungsverwaltung und den Missbrauchsschutz. Die Herkunft der Zieladresse und die Information eingeladener Personen nach Art. 14 DSGVO sind bei nicht direkt erhobenen Adressen zu berücksichtigen. Einladungsablauf und Datenlöschung sind verschieden: Eine automatische Bereinigung von Einladungen, Versandnachweisen und E-Mail-Sperrzuordnungen ist im Anwendungscode nicht eingerichtet. Der konkrete SMTP-Anbieter und verbindliche Aufbewahrungsfristen müssen vor rechtlicher Freigabe bestätigt werden.</p>
      </section>

      <section>
        <h2>5. Hosting und technische Protokolle</h2>
        <p>Das Projekt ist für den Betrieb bei Vercel eingerichtet. Beim Abruf und bei API-Anfragen können Vercel als Hosting-Dienstleister und seine Infrastrukturpartner IP-Adressen, Zeitpunkte, angefragte URLs, Browser- und Verbindungsinformationen, Statuscodes und technische Fehlerdaten verarbeiten. Dies dient der Auslieferung, Stabilität, Fehleranalyse und Abwehr von Missbrauch auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO; bei der angefragten App-Nutzung auch Art. 6 Abs. 1 lit. b DSGVO.</p>
        <p>Die Anwendung protokolliert technische Fehler; einzelne externe Fehlerrückmeldungen können in Serverprotokolle gelangen. Es gibt keine durchgängig belegte Bereinigung sämtlicher fremder Fehlertexte. Hosting-Logfristen, tatsächliche Region, Vertragspartner, Unterauftragnehmer und die Zuordnung des Betriebskontos zum Verein sind nicht aus der Projektkonfiguration nachweisbar und noch zu bestätigen. Eine feste Hosting-Speicherfrist oder ausschließliche Verarbeitung in Deutschland wird nicht zugesichert.</p>
      </section>

      <section>
        <h2>6. Firebase: Anmeldung, Datenbank und Dateien</h2>
        <p>Wir verwenden Google Firebase Authentication für Anmeldung und Kontoverwaltung, Cloud Firestore für Profil-, Projekt-, Berechtigungs-, Einladungs- und Kommunikationsdaten sowie Firebase Storage für Datei-Uploads, insbesondere im Projekt-Chat. Dabei verarbeitet Google die jeweils übermittelten Daten und technische Verbindungsinformationen.</p>
        <p>Firebase Authentication verarbeitet E-Mail-Adresse, Passwortauthentifizierung, UID und technische Anmeldeinformationen. Passwörter werden nicht in unseren Firestore-Profilen, Anwendungsprotokollen oder eigenen Browser-Einstellungen gespeichert. Das Firebase-SDK kann Anmeldezustände lokal vorhalten. Ein HttpOnly-Sitzungscookie ergänzt den Zugang zu geschützten Seiten. Serverseitige Token- und Freigabeprüfungen sowie Firestore- und Storage-Regeln begrenzen den Zugriff; Administratorrechte werden nicht allein aus einer E-Mail-Adresse abgeleitet.</p>
        <p>Die Verarbeitung dient der vereinbarten Nutzung nach Art. 6 Abs. 1 lit. b DSGVO und dem Schutz vor unberechtigtem Zugriff nach Art. 6 Abs. 1 lit. f DSGVO. Projektinhalte werden entsprechend den eingerichteten Zugriffsrechten für berechtigte Beteiligte bereitgestellt. Bei geteilten Vorlagen oder externen Download-URLs ist deren jeweilige Reichweite zu beachten.</p>
        <p>Firebase Cloud Messaging ist derzeit nicht initialisiert: Es sind weder eine Push-Tokenverwaltung noch ein Firebase-Messaging-Service-Worker eingebunden. Auch Firebase Analytics beziehungsweise Google Analytics for Firebase und ein gesondertes Google-Analytics-Tracking sind im untersuchten Anwendungscode nicht initialisiert. Konfigurationsfelder oder als „Analytics“ bezeichnete Editor-Bausteine allein belegen keinen solchen Dienst.</p>
        <p>Details, Grenzen der Löschung und offene Konfigurationsfragen stehen in den <Link href="/datenschutz/firebase" className="underline decoration-dotted">Firebase-Datenschutzhinweisen</Link>. Anbieterinformationen: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">Firebase Datenschutz und Sicherheit</a>.</p>
      </section>

      <section>
        <h2>7. Cookies, lokale Speicherung und Einwilligung</h2>
        <p>Für Login und angefragte Bedienfunktionen werden Cookies und vergleichbare Speicherungen verwendet. Soweit diese für den ausdrücklich gewünschten Dienst unbedingt erforderlich sind, gilt § 25 Abs. 2 Nr. 2 TDDDG; darüber hinaus ist eine Einwilligung nach § 25 Abs. 1 TDDDG erforderlich. Die anschließende Verarbeitung personenbezogener Daten richtet sich zusätzlich nach der DSGVO. Nicht jede Komforteinstellung ist automatisch technisch erforderlich.</p>
        <ul>
          <li><strong>__session:</strong> HttpOnly-Cookie für die geschützte App-Sitzung, maximal fünf Tage; Löschung beim vorgesehenen Logout und bei bestätigter Kontolöschung.</li>
          <li><strong>Firebase-Anmeldezustand:</strong> Das Auth-SDK kann Token und den Anmeldezustand im Browser speichern. Die tatsächliche Persistenz ist von SDK und Browser abhängig.</li>
          <li><strong>lang:</strong> Sprachwahl als Cookie mit einer gesetzten Laufzeit von einem Jahr und zusätzlich im Local Storage. Erneutes Schreiben kann die Cookie-Frist verlängern.</li>
          <li><strong>appschmiede_privacy_consent:</strong> Auswahl, Versionskennung und Zeitstempel im Local Storage sowie in einem Cookie mit 180 Tagen Laufzeit. Der lokale Eintrag hat keine automatische Ablaufzeit.</li>
          <li><strong>Editor- und Tutorialeinstellungen:</strong> zuletzt verwendetes Projekt, Layout und bereits gesehene Touren werden lokal gespeichert; im Code gibt es dafür keine automatische Ablaufzeit. Sie können über die Website-Daten des Browsers entfernt werden.</li>
        </ul>
        <p>Die Datenschutzeinstellungen bieten Zustimmung, Ablehnung und eine spätere Änderung für die Kategorie „Analyse“. Firebase Analytics ist derzeit weder initialisiert noch aktiviert. Der Schalter speichert nur die Auswahl; auch „Alle akzeptieren“ startet derzeit keine Analyse oder Werbedienste. Eine spätere Einführung von Analytics erfordert vorher aktualisierte Informationen und eine neue ausdrückliche Einwilligung. Eine Ablehnung verhindert weder Anmeldung noch Editorfunktionen.</p>
        <p>Ihre Auswahl können Sie jederzeit ändern oder widerrufen. Gespeicherte Auswahlen gelten nur für den aktuellen Versionsstand und höchstens 180 Tage; ältere kombinierte Auswahlen werden nicht übernommen. Ein abgelaufener lokaler Eintrag kann bis zum erneuten Speichern oder Entfernen der Website-Daten technisch bestehen bleiben, wird aber nicht als gültige Auswahl verwendet. Externe Medien sind nicht generell an diese Auswahl gekoppelt; bereits gesetzte Fremdcookies werden nicht zuverlässig entfernt. Die Einordnung von Komfortspeicherungen und externen Medien bleibt vor Freigabe zu prüfen.</p>
        <PrivacySettingsButton className="rounded-lg border border-white/20 px-4 py-2 text-sm transition hover:bg-white/10">
          Datenschutzeinstellungen öffnen
        </PrivacySettingsButton>
      </section>

      <section>
        <h2>8. KI-Funktionen und externe Verarbeitung</h2>
        <p>Die Einzel-Seitengenerierung kann bei gesetztem API-Schlüssel Beschreibungen und gegebenenfalls den Seitentitel serverseitig an die OpenAI-API senden. Übermittelt werden die für die Generierung zusammengestellten Texte und technische API-Metadaten. Eine pauschale Übertragung des gesamten gespeicherten Projekts ist in diesem Anfragepfad nicht vorgesehen; personenbezogene Angaben in einem Prompt werden jedoch Teil der Übermittlung. Die Mehrseiten-Generierung verwendet derzeit lokale Vorlagenlogik und keinen externen KI-Aufruf. Fehlt bei der Einzel-Seitengenerierung der API-Schlüssel, wird ebenfalls lokal ein Ergebnis aufgebaut.</p>
        <p>Die Bildgenerierung sendet eine auf 180 Zeichen begrenzte Bildbeschreibung an OpenAI, sofern ein API-Schlüssel vorhanden ist. Bei fehlendem Schlüssel oder einem Fehler wird Pollinations über image.pollinations.ai verwendet. Pollinations erhält die Beschreibung als Bestandteil der angefragten URL; sie kann dadurch in Anbieterprotokollen erscheinen. Der Abruf erfolgt serverseitig, nicht unmittelbar mit der Browser-IP. Eine Vertraulichkeit oder ausschließliche vereinsinterne Verarbeitung dieser Eingaben wird nicht zugesichert.</p>
        <p>Ergebnisse werden an den Browser zurückgegeben und können als Projektinhalt in Firestore gespeichert werden. Die hier untersuchten KI-Routen legen kein gesondertes Promptarchiv an; eingegebene Texte können aber bereits in Projektinhalten enthalten sein. Anbieter- und Hostingprotokolle sind davon zu unterscheiden.</p>
        <p>Die angeforderte Generierung kann auf Art. 6 Abs. 1 lit. b DSGVO beruhen. Für fremde oder sensible Daten in Prompts ist gesondert zu prüfen, ob eine geeignete Grundlage besteht; eine KI-Schaltfläche ersetzt diese Prüfung nicht. Empfänger sind der jeweilige KI-Anbieter und seine Dienstleister. Die konkreten Rollen, Auftragsverarbeitung, Unterauftragnehmer, internationalen Übermittlungen und Fristen müssen für das tatsächlich eingesetzte Produkt bestätigt werden.</p>
        <p>OpenAI beschreibt für seine API standardmäßig keine Verwendung von Eingaben und Ausgaben zum Modelltraining ohne ausdrückliches Opt-in. Dies ist eine Anbieterangabe, kein Nachweis der Einstellungen unseres Kontos. Eine besondere Zero-Data-Retention-Vereinbarung ist nicht nachgewiesen. Die für Pollinations geltenden Trainings-, Veröffentlichungs- und Speicherbedingungen sind ebenfalls offen. Bis zur Klärung sollten dort keine personenbezogenen oder vertraulichen Inhalte eingegeben werden.</p>
        <p><a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">OpenAI: API-Datenkontrollen und Aufbewahrung</a></p>
      </section>

      <section>
        <h2>9. QR-Codes, Karten, Videos und externe Medien</h2>
        <p>QR-Funktionen in Editor, Vorschau und QR-Werkzeugen rufen api.qrserver.com auf. Der dortige Dienst erhält den zu codierenden Text beziehungsweise die URL einschließlich möglicher Projekt- und Seitenkennungen sowie bei direktem Browserabruf IP-Adresse und Browserdaten. Bitte codieren Sie keine Zugangstokens oder vertraulichen personenbezogenen Inhalte. Zweck ist die angeforderte QR-Erstellung; Art. 6 Abs. 1 lit. b DSGVO kommt dafür in Betracht. Betreiber, Auftragsverarbeitungsrolle, Protokollierung, Aufbewahrung und Verarbeitungsorte sind noch zu verifizieren.</p>
        <p>Bei passenden Bausteinen werden Google Maps als eingebettete Karte, YouTube als Vorschaubild beziehungsweise Video sowie Bilder von images.unsplash.com und placehold.co abgerufen. Auch selbst hinterlegte Bild- und Medien-URLs können externe Empfänger einbinden. Diese erhalten technische Verbindungsdaten und je nach Funktion Suchort, Video-ID, Bildpfad, Referrer und weitere Inhalte der Abruf-URL. Die Verarbeitung hängt vom verwendeten Baustein und dem Anbieter ab; deren Speicherfristen sind nicht im Projekt hinterlegt.</p>
        <p>Diese Einbindungen sind im aktuellen Code nicht generell an den Consent-Banner gekoppelt. Insbesondere bei Tracking oder nicht unbedingt erforderlichem Endgerätezugriff ist vor dem Laden eine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO beziehungsweise § 25 Abs. 1 TDDDG zu prüfen und technisch sicherzustellen. Eine Nutzeranforderung kann nur die dafür tatsächlich erforderliche Verarbeitung nach Art. 6 Abs. 1 lit. b DSGVO tragen, nicht automatisch zusätzliche Anbieterzwecke. Browserberechtigungen, etwa für Mikrofonfunktionen, ersetzen keine Prüfung externer Übermittlungen.</p>
        <p>Normale externe Links, etwa zur Vereinswebsite, führen erst beim Aufrufen zur jeweiligen Zielseite. Deren Betreiber verantworten ihre eigene Datenverarbeitung. Für eingebettete Medien gilt diese bloße Linkbeschreibung nicht.</p>
      </section>

      <section>
        <h2>10. Kommunikation und gegebenenfalls historische Zahlungsdaten</h2>
        <p>Bei E-Mail-Anfragen sowie der Nutzung von Support und Projekt-Chat verarbeiten wir Kontaktinformationen, Nachrichtentexte, Anhänge, Zeitstempel und Bearbeitungsstatus. Zwecke sind die Beantwortung und Zusammenarbeit, gestützt auf Art. 6 Abs. 1 lit. b DSGVO bei nutzungsbezogenen Anliegen, ansonsten Art. 6 Abs. 1 lit. f DSGVO. Zugriff erhalten die jeweils berechtigten Bearbeitenden und technischen Dienstleister. Nicht mehr benötigte Vorgänge sind zu löschen; feste operative Löschfristen sind noch festzulegen.</p>
        <p>Die aktuelle App-Nutzung ist kostenlos; neue Stripe-Checkouts sind in der gegenwärtigen Konfiguration gesperrt. Technisch vorhanden bleiben historische Plan-, Guthaben-, Kunden-, Abonnement- und Ereignisfelder sowie Stripe-Webhook- und Kündigungsrouten. Das belegt weder tatsächliche frühere Zahlungen noch eine Beendigung eventuell extern noch bestehender Abonnements.</p>
        <p>Falls historische Zahlungsvorgänge bestehen, können Stripe, beteiligte Finanzdienstleister und zuständige Stellen Daten zur früheren Vertragsabwicklung, zu Belegen, gesetzlichen Aufbewahrungspflichten oder Rechtsansprüchen weiter verarbeiten. Je nach Zweck kommen Art. 6 Abs. 1 lit. b, c oder f DSGVO in Betracht. Die einschlägige Pflicht, Datenkategorie und Frist sind im Einzelfall festzustellen; es wird keine pauschale Aufbewahrungsdauer behauptet. Bestand, Vertragspartner und Zahlungsstatus wurden nicht in produktiven Systemen abgefragt. Die Umstellung löscht solche Daten nicht und kündigt keine externen Verträge.</p>
      </section>

      <section>
        <h2>11. Empfänger, Auftragsverarbeitung und internationale Übermittlungen</h2>
        <p>Zugriff erhalten im erforderlichen Umfang berechtigte Vereinsadministratoren, die für ein Projekt zugelassenen Beteiligten, Hosting-, Cloud-, Mail- und gegebenenfalls KI-, Medien- oder historische Zahlungsdienstleister. Gesetzlich verpflichtende Offenlegungen an Behörden bleiben möglich. Nicht jeder Dienstleister ist automatisch Auftragsverarbeiter; insbesondere zusätzliche eigene Anbieterzwecke sind gesondert zu bewerten.</p>
        <p>Soweit ein Dienst Daten in unserem Auftrag verarbeitet, ist ein Vertrag nach Art. 28 DSGVO erforderlich. Öffentlich verfügbare Anbieter-Datenschutzbedingungen belegen keinen für den Verein abgeschlossenen Vertrag. Nachweise für Vercel, Google/Firebase, SMTP und gegebenenfalls KI-Anbieter einschließlich Unterauftragnehmern sind noch zu bestätigen.</p>
        <p>Bei Vercel, Google, OpenAI, Pollinations und weiteren externen Diensten können Verarbeitungen außerhalb von EU und EWR auftreten. Regionen oder ausschließlich europäische Speicherung sind hier nicht nachgewiesen. Übermittlungen bedürfen der Voraussetzungen der Art. 44 ff. DSGVO, etwa eines einschlägigen Angemessenheitsbeschlusses oder geeigneter Garantien wie Standardvertragsklauseln einschließlich der nötigen Zusatzprüfung. Eine Zertifizierung oder Vertragsklausel muss für den konkreten Empfänger und Dienst geprüft werden; sie wird hier nicht als vorhanden zugesichert.</p>
      </section>

      <section>
        <h2>12. Speicherdauer und Kontolöschung</h2>
        <p>Daten sollen nur so lange verarbeitet werden, wie dies für den jeweiligen Zweck erforderlich ist oder eine konkrete gesetzliche Pflicht besteht. Das ist von der tatsächlich eingerichteten Löschtechnik zu unterscheiden: Im untersuchten Anwendungscode besteht kein umfassender automatischer Löschplan für Projekte, Einladungen, Support, Dateien, Sicherheitszähler oder Hostingprotokolle. Externe Dienste können eigene Fristen haben; diese sind anhand der Verträge und Einstellungen zu ergänzen.</p>
        <p>Die bestätigte Kontolöschung entfernt das Firebase-Auth-Konto und danach das eigene Firestore-Profildokument und beendet die App-Sitzung. Projekte und Unterseiten, Chat- und Supportdaten, Storage-Dateien, Einladungs- und Freigabedokumente werden nicht automatisch kaskadierend gelöscht. Schlägt die Profilbereinigung nach erfolgreicher Auth-Löschung fehl, wird dies ausdrücklich gemeldet. Bitte richten Sie weitergehende Löschanfragen an den Verein; ein verbleibender Datensatz ist nicht allein durch sein technisches Vorhandensein rechtmäßig aufbewahrt.</p>
        <p>Ein verbindliches Löschkonzept muss Zweckfortfall, Rechte anderer Beteiligter, gesetzliche Pflichten, Sicherungen und begrenzte Nachweisinteressen berücksichtigen. Für den tatsächlichen Bestand sind Verantwortliche und konkrete Fristen noch zu bestätigen.</p>
      </section>

      <section>
        <h2>13. Ihre Datenschutzrechte und Beschwerdemöglichkeiten</h2>
        <ul>
          <li>Auskunft über Ihre personenbezogenen Daten nach Art. 15 DSGVO und Berichtigung nach Art. 16 DSGVO.</li>
          <li>Löschung nach Art. 17 DSGVO und Einschränkung der Verarbeitung nach Art. 18 DSGVO, jeweils unter den gesetzlichen Voraussetzungen.</li>
          <li>Datenübertragbarkeit nach Art. 20 DSGVO bei entsprechend erfassten automatisierten Verarbeitungen auf Grundlage von Einwilligung oder Vertrag.</li>
          <li>Widerspruch nach Art. 21 DSGVO gegen Verarbeitungen nach Art. 6 Abs. 1 lit. f DSGVO aus Ihrer besonderen Situation; gegen Direktwerbung jederzeit.</li>
          <li>Widerruf einer Einwilligung jederzeit mit Wirkung für die Zukunft nach Art. 7 Abs. 3 DSGVO. Die Rechtmäßigkeit der vorherigen Verarbeitung bleibt unberührt.</li>
          <li>Beschwerde bei einer Aufsichtsbehörde nach Art. 77 DSGVO, insbesondere am Aufenthaltsort, Arbeitsplatz oder Ort des vermuteten Verstoßes.</li>
        </ul>
        <p>Kontakt: <a href="mailto:info@headbang-handwerk.de" className="underline decoration-dotted">info@headbang-handwerk.de</a>. Für den Vereinssitz in Wardenburg ist der Landesbeauftragte für den Datenschutz Niedersachsen zuständig: Prinzenstraße 5, 30159 Hannover; <a href="mailto:poststelle@lfd.niedersachsen.de" className="break-words underline decoration-dotted">poststelle@lfd.niedersachsen.de</a>; <a href="https://www.lfd.niedersachsen.de/" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">Website der Aufsichtsbehörde</a>.</p>
        <p>Im Anwendungscode ist keine ausschließlich automatisierte Entscheidung mit rechtlicher oder vergleichbar erheblicher Wirkung nach Art. 22 DSGVO vorgesehen. KI-Layoutvorschläge ersetzen keine solche Entscheidung.</p>
      </section>

      <section>
        <h2>14. Offene Punkte vor rechtlicher Freigabe</h2>
        <p>Dieser redaktionelle Stand beschreibt die untersuchte Implementierung, bestätigt aber weder einen rechtskonformen Produktivbetrieb noch nicht vorgelegte Verträge. Vor Veröffentlichung sind insbesondere die konkreten Anbieter und Vertragsrollen, Auftragsverarbeitungsverträge, Drittlandmechanismen, Hosting-/Firebase-Regionen, SMTP-Anbieter, Löschfristen und Sicherungen, KI-Trainingseinstellungen und Medien-Einwilligungen zu bestätigen beziehungsweise umzusetzen. Eine künftige Analytics-Aktivierung bedarf einer gesonderten technischen und rechtlichen Prüfung einschließlich wirksamer Einwilligung und Widerruf. Auch die Erforderlichkeit eines Datenschutzbeauftragten und gegebenenfalls einer Datenschutz-Folgenabschätzung ist anhand des tatsächlichen Betriebs zu prüfen. Änderungen der Dienste oder Abläufe erfordern eine erneute Aktualisierung dieser Hinweise.</p>
      </section>
    </LegalPageShell>
  );
}
