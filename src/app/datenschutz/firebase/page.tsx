import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Firebase-Datenschutzhinweise',
  description: 'Ergänzende Datenschutzhinweise für Funktionen auf Basis von Google Firebase.',
};

export default function FirebasePrivacyPage() {
  return (
    <LegalPageShell
      title="Ergänzende Datenschutzhinweise"
      subtitle="für Funktionen auf Basis von Google Firebase"
      updatedAt="08.03.2026"
    >
      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Ramon Meyer<br />
          Einzelunternehmer<br />
          Beethovenstraße 3<br />
          26810 Westoverledingen<br />
          Deutschland<br />
          E-Mail: <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>
        </p>
      </section>

      <section>
        <h2>2. Zweck dieser Hinweise</h2>
        <p>Diese ergänzenden Datenschutzhinweise beschreiben die Verarbeitung personenbezogener Daten im Zusammenhang mit Funktionen unserer Web-App, die auf Google Firebase basieren.</p>
      </section>

      <section>
        <h2>3. Verwendete Firebase-Dienste</h2>
        <ul>
          <li>Firebase Authentication</li>
          <li>Cloud Firestore</li>
          <li>Firebase Cloud Messaging</li>
          <li>Firebase Analytics beziehungsweise Google Analytics for Firebase</li>
        </ul>
      </section>

      <section>
        <h2>4. Firebase Authentication</h2>
        <p>Zur Registrierung, Anmeldung und Verwaltung von Nutzerkonten verwenden wir Firebase Authentication.</p>
        <p>Dabei können insbesondere folgende Daten verarbeitet werden:</p>
        <ul>
          <li>E-Mail-Adresse</li>
          <li>Authentifizierungsdaten</li>
          <li>interne Nutzerkennungen</li>
          <li>Registrierungs- und Login-Zeitpunkte</li>
          <li>sicherheitsrelevante technische Informationen</li>
        </ul>
        <p>Zweck:</p>
        <ul>
          <li>Einrichtung und Verwaltung von Nutzerkonten</li>
          <li>sichere Anmeldung</li>
          <li>Schutz vor Missbrauch und unbefugtem Zugriff</li>
        </ul>
        <p>Rechtsgrundlage:</p>
        <p>Art. 6 Abs. 1 lit. b DSGVO<br />Art. 6 Abs. 1 lit. f DSGVO</p>
      </section>

      <section>
        <h2>5. Cloud Firestore</h2>
        <p>Zur Speicherung und Bereitstellung von Nutzer- und App-Daten verwenden wir Cloud Firestore.</p>
        <p>Dabei können insbesondere folgende Daten verarbeitet werden:</p>
        <ul>
          <li>Vorname</li>
          <li>Nachname</li>
          <li>optional Unternehmen beziehungsweise Firmenname</li>
          <li>E-Mail-Adresse</li>
          <li>Profilbild, sofern hochgeladen</li>
          <li>Kontoeinstellungen</li>
          <li>nutzungsbezogene Daten innerhalb der App</li>
          <li>Vertrags- oder Statusinformationen, soweit für die Nutzung erforderlich</li>
        </ul>
        <p>Zweck:</p>
        <ul>
          <li>Bereitstellung der App-Funktionen</li>
          <li>Verwaltung von Profil- und Kontodaten</li>
          <li>Speicherung appbezogener Inhalte und Einstellungen</li>
        </ul>
        <p>Rechtsgrundlage:</p>
        <p>Art. 6 Abs. 1 lit. b DSGVO</p>
      </section>

      <section>
        <h2>6. Firebase Cloud Messaging</h2>
        <p>Wenn Nutzer Push-Benachrichtigungen aktivieren, verwenden wir Firebase Cloud Messaging.</p>
        <p>Dabei können insbesondere verarbeitet werden:</p>
        <ul>
          <li>Push-Token beziehungsweise Messaging-Token</li>
          <li>Browser- oder Geräteeigenschaften</li>
          <li>technische Zustellinformationen</li>
          <li>Benachrichtigungseinstellungen</li>
        </ul>
        <p>Zweck:</p>
        <ul>
          <li>Versand technischer und nutzungsbezogener Benachrichtigungen</li>
          <li>Information über relevante Vorgänge innerhalb der App</li>
        </ul>
        <p>Rechtsgrundlage:</p>
        <p>Art. 6 Abs. 1 lit. a DSGVO</p>
        <p>Die Einwilligung kann jederzeit mit Wirkung für die Zukunft über die Browser- beziehungsweise Geräteeinstellungen und sofern vorhanden auch im Nutzerkonto widerrufen werden.</p>
      </section>

      <section>
        <h2>7. Firebase Analytics beziehungsweise Google Analytics for Firebase</h2>
        <p>Soweit eine Einwilligung erteilt wurde, verwenden wir Firebase Analytics, um die Nutzung unserer Web-App statistisch auszuwerten und Funktionen zu verbessern.</p>
        <p>Dabei können insbesondere verarbeitet werden:</p>
        <ul>
          <li>Nutzungsereignisse</li>
          <li>Sitzungs- und Interaktionsdaten</li>
          <li>technische Geräte- und Browserinformationen</li>
          <li>pseudonyme Kennungen</li>
        </ul>
        <p>Zweck:</p>
        <ul>
          <li>Reichweitenmessung</li>
          <li>Fehler- und Nutzungsanalyse</li>
          <li>Verbesserung der Benutzerfreundlichkeit</li>
        </ul>
        <p>Rechtsgrundlage:</p>
        <p>Art. 6 Abs. 1 lit. a DSGVO sowie, soweit erforderlich, § 25 Abs. 1 TDDDG</p>
      </section>

      <section>
        <h2>8. Empfänger und internationale Datenverarbeitung</h2>
        <p>Firebase ist ein Dienst von Google. Im Rahmen der Nutzung von Firebase kann eine Verarbeitung personenbezogener Daten auch außerhalb der EU beziehungsweise des EWR nicht ausgeschlossen werden.</p>
        <p>Soweit hierfür erforderlich, werden geeignete Garantien im Sinne der Art. 44 ff. DSGVO eingesetzt.</p>
      </section>

      <section>
        <h2>9. Speicherdauer</h2>
        <p>Firebase-bezogene Daten speichern wir nur so lange, wie dies für die jeweiligen Zwecke erforderlich ist.</p>
        <p>Insbesondere gilt:</p>
        <ul>
          <li>Kontodaten bis zur Löschung des Kontos oder Beendigung des Vertragsverhältnisses,</li>
          <li>Push-Token bis zum Widerruf oder zur Deaktivierung,</li>
          <li>Analyse-Daten nach Maßgabe Ihrer Einwilligung und der eingerichteten Systemeinstellungen,</li>
          <li>abrechnungs- oder vertragsbezogene Angaben im Rahmen gesetzlicher Aufbewahrungspflichten länger.</li>
        </ul>
      </section>

      <section>
        <h2>10. Ihre Rechte</h2>
        <p>Sie haben die gesetzlichen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit, Widerspruch und Widerruf erteilter Einwilligungen.</p>
        <p>
          Anfragen richten Sie bitte an:<br />
          <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>
        </p>
      </section>
    </LegalPageShell>
  );
}