import Link from 'next/link';
import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Firebase-Datenschutzhinweise',
  description: 'Firebase Authentication, Firestore und Storage in der kostenlosen AppSchmiede von Headbang Handwerk e. V.',
};

export default function FirebasePrivacyPage() {
  return (
    <LegalPageShell title="Firebase-Datenschutzhinweise" subtitle="Ergänzende Informationen zur einladungsbasierten AppSchmiede" updatedAt="28.10.2026">
      <section>
        <h2>1. Verantwortlicher und Zusammenhang</h2>
        <p>
          Headbang Handwerk e. V.<br />
          Wiesengrund 5<br />
          26203 Wardenburg<br />
          Deutschland
        </p>
        <p>Vertreten durch den Vorstand: Daniel Bigl, Ramon Meyer und Melanie Stephan. Kontakt: <a href="mailto:info@headbang-handwerk.de" className="underline decoration-dotted">info@headbang-handwerk.de</a>.</p>
        <p>Diese Hinweise ergänzen die <Link href="/datenschutz" className="underline decoration-dotted">Datenschutzerklärung</Link>. Vereinsangaben stehen im <Link href="/impressum" className="underline decoration-dotted">Impressum</Link>. Die Nutzung ist für autorisierte Mitglieder und Partner kostenlos und erfordert keine nutzerseitige Coin-Abrechnung oder kostenpflichtige App-Abonnements.</p>
      </section>

      <section>
        <h2>2. Tatsächlich verwendete Dienste</h2>
        <ul>
          <li><strong>Firebase Authentication:</strong> Konten, Anmeldung, erneute Passwortprüfung und Passwortänderung.</li>
          <li><strong>Cloud Firestore:</strong> Profile, Rollen, Zugangsfreigaben, Einladungen, Projekte, Seiten, Vorlagen, Support- und Kommunikationsdaten.</li>
          <li><strong>Firebase Storage:</strong> Datei- und Bild-Uploads im Projekt-Chat und zugehörige Download-URLs.</li>
        </ul>
        <p>Die Anwendung verwendet Client-SDKs und serverseitig das Firebase Admin SDK. Firebase Cloud Messaging ist nicht initialisiert; eine produktive Push-Tokenverwaltung oder ein Messaging-Service-Worker ist im Projekt nicht eingebunden. Firebase Analytics beziehungsweise Google Analytics for Firebase und ein eigenständiges Google-Analytics-Tracking werden nicht initialisiert. Messaging-Sender-ID und beispielhafte Analytics-Konfigurationsfelder sind kein Nachweis einer Nutzung dieser Dienste. Die Kategorie „Analyse“ in den Datenschutzeinstellungen speichert derzeit nur Ihre Auswahl und aktiviert keinen Dienst. Eine spätere Analytics-Einführung erfordert eine neue Einwilligung.</p>
      </section>

      <section>
        <h2>3. Registrierung nur durch persönliche Einladung</h2>
        <p>Die öffentliche Registrierungsadresse bietet keinen freien Kontoantrag an. Die Administration versendet einen persönlichen Link an eine festgelegte E-Mail-Adresse. Eine Einladung ist sieben Tage gültig und einmal verwendbar. Firestore speichert den Hash des zufälligen Tokens, Status, Frist und Verwaltungsinformationen, nicht den Klartext-Link.</p>
        <p>Beim Einlösen werden das angemeldete Firebase-Konto und seine E-Mail-Adresse mit der Einladung abgeglichen. Der Besitz des an diese Adresse versandten Links bildet den E-Mail-Nachweis; eine zusätzliche Firebase-Verifizierungsmail ist nicht vorgesehen. Nach erfolgreicher Einlösung wird die Adresse administrativ als bestätigt markiert. Ist dieser nachgelagerte Firebase-Schritt vorübergehend nicht erfolgreich, kann die transaktional eingerichtete Zugangsfreigabe bereits bestehen.</p>
        <p>Einlösung, UID-Zuordnung und aktive Freigabe werden dokumentiert. IP-bezogene Hash-Zähler begrenzen Prüf- und Einlöseversuche; die Einladungserstellung und erneuter Versand sind zusätzlich je Administrator begrenzt. Ein Ablaufdatum im Dokument beendet nicht automatisch dessen Speicherung. Details zum SMTP-Versand, zu Statusdaten und offenen Löschfristen stehen in der <Link href="/datenschutz" className="underline decoration-dotted">Datenschutzerklärung</Link>.</p>
      </section>

      <section>
        <h2>4. Authentication und Sitzungen</h2>
        <p>Firebase Authentication verarbeitet insbesondere E-Mail-Adresse, UID, Anmeldemethode, Authentifizierungsdaten und technische Sicherheitsinformationen. Bei E-Mail/Passwort-Konten erfolgt die Passwortverarbeitung durch Firebase Authentication. Eigene Profil- oder Projektdokumente enthalten keine Passwörter. Die Passwortänderung prüft die Firebase-Passwortrichtlinie und das aktuelle Passwort durch erneute Authentifizierung.</p>
        <p>Das Firebase-SDK kann den Anmeldezustand und Token lokal im Browser speichern. Nach erfolgreicher Anmeldung wird ein HttpOnly-Sitzungscookie mit höchstens fünf Tagen Laufzeit eingerichtet. Server prüfen Token beziehungsweise Sitzung einschließlich Widerruf und aktuelle Zugangsfreigabe oder Administratorrolle. Eine Anmeldung bei Firebase allein berechtigt nicht automatisch zur App-Nutzung.</p>
        <p>Zwecke und Rechtsgrundlagen: Bereitstellung des angefragten Zugangs nach Art. 6 Abs. 1 lit. b DSGVO und notwendige Sicherheitskontrollen nach Art. 6 Abs. 1 lit. f DSGVO. Für unbedingt erforderliche Endgerätezugriffe gilt § 25 Abs. 2 Nr. 2 TDDDG; weitergehende Speicherungen bedürfen einer gesonderten Prüfung.</p>
      </section>

      <section>
        <h2>5. Firestore: Profile, Projekte und Kommunikation</h2>
        <p>Gespeichert werden unter anderem E-Mail-Adresse, angezeigter Name, optionale Vor- und Nachnamen, Unternehmen, Telefonnummer, Einstellungen, UID, Rollen- und Freigabestatus, Einladungszuordnung und Zeitstempel. Projekte umfassen Eigentümer- und gegebenenfalls Mitgliederkennungen, Seiten, Layouts, Inhalte, Vorlagen und Bearbeitungsinformationen. Bei Nutzung von Support, Aufgaben und Projekt-Chat kommen Nachrichten, Zuständigkeiten und Statusinformationen hinzu.</p>
        <p>Historische Plan-, Guthaben- oder Stripe-Referenzfelder können weiterhin in Profilen vorkommen. Ihr technisches Vorhandensein begründet keine aktuelle Zahlungspflicht. Ob tatsächlich abrechnungsbezogene Bestandsdaten vorhanden sind, wurde nicht in produktiven Datenbeständen geprüft.</p>
        <p>Die Daten dienen der vereinbarten Funktion nach Art. 6 Abs. 1 lit. b DSGVO; notwendige Rechteverwaltung und Sicherheitsnachweise können auf Art. 6 Abs. 1 lit. f DSGVO beruhen. Zugriff erhalten entsprechend den Regeln die berechtigten Nutzer beziehungsweise Verwaltungsrollen. Zentral freigegebene Vorlagen können weiteren berechtigten Personen zur Verfügung stehen.</p>
      </section>

      <section>
        <h2>6. Storage und hochgeladene Dateien</h2>
        <p>Die Projekt-Chatfunktion lädt Dateien in Firebase Storage und speichert die Download-URL in der zugehörigen Nachricht. Dabei können Dateiinhalte, Namen, Pfade, Eigentümer- beziehungsweise Projektkennungen und technische Metadaten verarbeitet werden. Zweck ist die angeforderte Dateibereitstellung nach Art. 6 Abs. 1 lit. b DSGVO.</p>
        <p>Storage-Regeln beschränken den Clientzugriff nach Projektberechtigung beziehungsweise Administratorrolle. Zusätzlich erzeugte Download-URLs können eigenständig weitergegeben werden; ihre Zugänglichkeit und gegebenenfalls notwendige Rücknahme sind gesondert zu beachten. Bitte laden Sie nur zulässige und erforderliche Inhalte hoch. Eine automatische Entfernung sämtlicher Dateien bei Kontolöschung ist nicht umgesetzt.</p>
      </section>

      <section>
        <h2>7. Sicherheitsdaten und administrative Rechte</h2>
        <p>Server verwalten Rollen und Freigaben, während Firestore- und Storage-Regeln unberechtigte Clientzugriffe begrenzen. Einladungstokens werden gehasht, Einlösungen transaktional gegen Mehrfachnutzung geschützt und Authentifizierungsdaten bei sensiblen Aktionen erneut geprüft. Technische Fehlerdaten und aktionsbezogene Hash-Zähler unterstützen den Missbrauchsschutz.</p>
        <p>Diese Maßnahmen sind keine Garantie vollständiger Sicherheit und ersetzen keine laufende Überprüfung der produktiven Regeln, Berechtigungen und Protokollierung. Rechtsgrundlage für erforderliche Schutzmaßnahmen ist Art. 6 Abs. 1 lit. f DSGVO; konkrete gesetzliche Sicherheitspflichten sind ergänzend zu berücksichtigen.</p>
      </section>

      <section>
        <h2>8. Google als Empfänger, Auftragsverarbeitung und Drittlandbezug</h2>
        <p>Empfänger der über die Firebase-Dienste übermittelten Daten sind Google als technischer Dienstleister und die für den konkreten Dienst eingesetzten Unterauftragnehmer. Die tatsächliche Vertragsgesellschaft, gebuchten Dienste, Speicherregionen und internationalen Zugriffe sind anhand des Vereinskontos zu bestimmen.</p>
        <p>Für weisungsgebundene Verarbeitung ist eine Vereinbarung nach Art. 28 DSGVO erforderlich. Firebase veröffentlicht entsprechende Datenschutz- und Datenverarbeitungsbedingungen; ein für diesen Verein nachgewiesener Vertragsabschluss lässt sich daraus nicht ableiten. Es wird weder eine bestimmte Serverregion noch eine ausschließliche EU-Verarbeitung zugesichert. Für Übermittlungen außerhalb von EU/EWR sind Art. 44 ff. DSGVO und der jeweils wirksame Transfermechanismus einschließlich nötiger Zusatzmaßnahmen zu prüfen.</p>
        <p>Anbieterinformationen: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">Firebase Datenschutz und Sicherheit</a> und <a href="https://firebase.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">Firebase-Vertragsbedingungen</a>.</p>
      </section>

      <section>
        <h2>9. Speicherdauer, Löschung und verbleibende Inhalte</h2>
        <p>Die Speicherdauer richtet sich nach dem erforderlichen Zweck und gegebenenfalls nach konkret anwendbaren gesetzlichen Pflichten. Im Code ist kein vollständiger automatischer Löschplan für Profile, Projekte, Unterseiten, Dateien, Einladungen und Kommunikationsdaten eingerichtet. Ablaufmarkierungen der Einladungen und Sicherheitszähler sind kein Nachweis einer konfigurierten Firestore-TTL-Löschung.</p>
        <p>Die freiwillige Kontolöschung erfordert ausdrückliche Bestätigung und eine höchstens fünf Minuten alte Authentifizierung. Der Server löscht das Firebase-Auth-Konto und anschließend das eigene Firestore-Profildokument. Schlägt die Profilbereinigung nach erfolgreicher Kontolöschung fehl, wird dies als Teilfehler gemeldet. Die App-Sitzung wird beendet.</p>
        <p>Projekte, Unterkollektionen, Dateien, Nachrichten, Einladungen und Freigabedokumente bleiben ohne zusätzliche Bereinigung technisch bestehen. Daraus folgt kein unbegrenztes Aufbewahrungsrecht. Weitergehende Lösch- und Exportanfragen sind an den Verein zu richten. Ein dokumentiertes Verfahren muss gemeinsame Inhalte, Rechte anderer Beteiligter, Sicherungen und tatsächlich erforderliche Nachweise berücksichtigen.</p>
      </section>

      <section>
        <h2>10. Rechte und Kontakt</h2>
        <p>Nach den gesetzlichen Voraussetzungen bestehen Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Widerruf einer Einwilligung. Kontakt: <a href="mailto:info@headbang-handwerk.de" className="underline decoration-dotted">info@headbang-handwerk.de</a>. Sie können sich insbesondere beim <a href="https://www.lfd.niedersachsen.de/" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">Landesbeauftragten für den Datenschutz Niedersachsen</a> beschweren. Die Einzelheiten finden Sie in der <Link href="/datenschutz" className="underline decoration-dotted">Datenschutzerklärung</Link>.</p>
      </section>

      <section>
        <h2>11. Offene Konfigurations- und Freigabepunkte</h2>
        <p>Vor Veröffentlichung sind die tatsächlichen Google-Vertrags- und Projektinhaber, Datenregionen, Auftragsverarbeitung, Unterauftragnehmer, Drittlandmechanismen, Anbieterfristen, Sicherungen sowie ein verbindliches Löschverfahren einschließlich Einladungs- und Dateidaten zu bestätigen. Änderungen an Firebase-Diensten, insbesondere eine künftige Aktivierung von Analytics oder Messaging, erfordern zuvor eine neue Datenschutz- und Einwilligungsprüfung. Diese Hinweise dokumentieren den technischen Stand, nicht eine bereits erfolgte rechtliche Freigabe.</p>
      </section>
    </LegalPageShell>
  );
}
