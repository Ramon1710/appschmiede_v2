import Link from 'next/link';
import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'AGB',
  description: 'Allgemeine Geschäftsbedingungen für die Nutzung von myappschmiede.com.',
};

export default function AgbPage() {
  return (
    <LegalPageShell
      title="Allgemeine Geschäftsbedingungen (AGB)"
      subtitle="für die Nutzung von myappschmiede.com"
      updatedAt="08.03.2026"
    >
      <section>
        <h2>1. Geltungsbereich</h2>
        <p>1.1 Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung der Plattform myappschmiede.com nachfolgend Plattform oder Dienst durch ihre Nutzerinnen und Nutzer.</p>
        <p>1.2 Anbieter der Plattform ist:</p>
        <p>
          Ramon Meyer<br />
          Einzelunternehmer<br />
          Beethovenstraße 3<br />
          26810 Westoverledingen<br />
          Deutschland<br />
          E-Mail: <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>
        </p>
        <p>1.3 Diese AGB gelten gegenüber Verbrauchern und Unternehmern. Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können. Unternehmer ist eine natürliche oder juristische Person oder eine rechtsfähige Personengesellschaft, die bei Abschluss des Vertrags in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handelt.</p>
        <p>
          1.4 Ergänzend zu diesen AGB können für einzelne Funktionen, kostenpflichtige Tarife oder Aktionen besondere Bedingungen gelten. Für kostenpflichtige wiederkehrende Abonnements gelten ergänzend die{' '}
          <Link href="/stripe-subscriptions" className="underline decoration-dotted">
            Terms of Service für Stripe-Subscriptions
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>2. Vertragsgegenstand</h2>
        <p>2.1 myappschmiede.com ist eine webbasierte Software-Plattform. Der genaue Leistungsumfang ergibt sich aus der jeweils aktuellen Beschreibung auf der Website, im Nutzerkonto oder im Checkout.</p>
        <p>2.2 Der Anbieter schuldet die Bereitstellung der jeweils ausdrücklich angebotenen digitalen Leistungen, nicht jedoch einen bestimmten wirtschaftlichen Erfolg, ein bestimmtes Nutzungsergebnis oder eine permanente Verfügbarkeit ohne Unterbrechung.</p>
        <p>2.3 Der Anbieter ist berechtigt, den Dienst technisch und inhaltlich weiterzuentwickeln, soweit hierdurch die berechtigten Interessen der Nutzer nicht unzumutbar beeinträchtigt werden.</p>
      </section>

      <section>
        <h2>3. Registrierung und Nutzerkonto</h2>
        <p>3.1 Für die Nutzung bestimmter Funktionen ist eine Registrierung erforderlich.</p>
        <p>3.2 Bei der Registrierung sind wahrheitsgemäße, vollständige und aktuelle Angaben zu machen. Änderungen der bei der Registrierung angegebenen Daten sind im Nutzerkonto unverzüglich zu aktualisieren.</p>
        <p>3.3 Zugangsdaten sind geheim zu halten und vor dem Zugriff Dritter zu schützen. Eine Weitergabe des Nutzerkontos an Dritte ist unzulässig.</p>
        <p>3.4 Der Anbieter ist berechtigt, Registrierungen abzulehnen oder Nutzerkonten zu sperren, wenn konkrete Anhaltspunkte für Missbrauch, Rechtsverstöße oder falsche Angaben vorliegen.</p>
      </section>

      <section>
        <h2>4. Vertragsschluss</h2>
        <p>4.1 Der Vertrag über eine unentgeltliche Basisnutzung kommt mit Abschluss der Registrierung und Freischaltung des Nutzerkontos zustande.</p>
        <p>4.2 Der Vertrag über kostenpflichtige Leistungen kommt zustande, wenn der Nutzer den Bestellprozess abschließt und der Anbieter die Buchung annimmt, etwa durch Bestätigungsanzeige, Bestätigungs-E-Mail oder Freischaltung der gebuchten Leistung.</p>
        <p>4.3 Vor Abgabe einer kostenpflichtigen Bestellung werden die wesentlichen Merkmale der Leistung, Preise, Laufzeiten und Abrechnungsintervalle im Bestellprozess angezeigt.</p>
      </section>

      <section>
        <h2>5. Leistungsumfang und Verfügbarkeit</h2>
        <p>5.1 Der Anbieter bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit der Plattform. Wartungsarbeiten, sicherheitsbedingte Unterbrechungen, technische Störungen, höhere Gewalt oder Umstände außerhalb des Einflussbereichs des Anbieters können jedoch zu vorübergehenden Einschränkungen führen.</p>
        <p>5.2 Ein Anspruch auf eine bestimmte Mindestverfügbarkeit besteht nur, wenn dies ausdrücklich schriftlich vereinbart wurde.</p>
        <p>5.3 Der Anbieter kann Funktionen hinzufügen, ändern oder entfernen, soweit dies aus technischen, sicherheitsrelevanten, rechtlichen oder wirtschaftlichen Gründen erforderlich ist und wesentliche Vertragspflichten dadurch nicht ausgehöhlt werden.</p>
      </section>

      <section>
        <h2>6. Pflichten der Nutzer</h2>
        <p>6.1 Nutzer dürfen die Plattform nur im Rahmen der geltenden Gesetze und dieser AGB verwenden.</p>
        <p>6.2 Untersagt sind insbesondere:</p>
        <ul>
          <li>die Eingabe, Speicherung oder Verbreitung rechtswidriger Inhalte,</li>
          <li>die Verletzung von Rechten Dritter,</li>
          <li>missbräuchliche Zugriffe,</li>
          <li>die Umgehung technischer Schutzmaßnahmen,</li>
          <li>automatisiertes Auslesen der Plattform ohne ausdrückliche Erlaubnis,</li>
          <li>die Nutzung zu betrügerischen oder sicherheitsgefährdenden Zwecken.</li>
        </ul>
        <p>6.3 Nutzer sind verpflichtet, ihre Daten eigenverantwortlich zu sichern, soweit die Plattform hierfür Export- oder Sicherungsmöglichkeiten bietet oder soweit dies nach Art der Daten zumutbar ist.</p>
      </section>

      <section>
        <h2>7. Preise und Zahlung</h2>
        <p>7.1 Die Nutzung bestimmter Leistungen kann kostenpflichtig sein. Maßgeblich sind die jeweils im Bestellprozess oder auf der Angebotsseite angegebenen Preise.</p>
        <p>7.2 Zahlungen für kostenpflichtige Tarife oder Abonnements werden über Stripe abgewickelt. Es gelten ergänzend die besonderen Regelungen für Stripe-Subscriptions.</p>
        <p>7.3 Rechnungen und Zahlungsbelege können elektronisch bereitgestellt oder elektronisch versandt werden.</p>
      </section>

      <section>
        <h2>8. Nutzungsrechte</h2>
        <p>8.1 Der Anbieter räumt dem Nutzer für die Laufzeit des Vertrags ein einfaches, nicht übertragbares, widerrufliches Recht ein, die Plattform im vertragsgemäßen Umfang zu nutzen.</p>
        <p>8.2 Eine weitergehende Nutzung, insbesondere Vervielfältigung, Bearbeitung, öffentliche Zugänglichmachung oder Weitergabe der Plattform oder ihrer Bestandteile, ist nur mit vorheriger ausdrücklicher Zustimmung des Anbieters zulässig.</p>
      </section>

      <section>
        <h2>9. Inhalte der Nutzer</h2>
        <p>9.1 Soweit Nutzer Inhalte in die Plattform einstellen, speichern oder verarbeiten, verbleiben die Rechte an diesen Inhalten grundsätzlich beim jeweiligen Nutzer bzw. Rechteinhaber.</p>
        <p>9.2 Der Nutzer räumt dem Anbieter die erforderlichen Rechte ein, diese Inhalte technisch zu verarbeiten, zu speichern, zu übertragen und darzustellen, soweit dies zur Bereitstellung der Plattform und der vertraglich geschuldeten Funktionen erforderlich ist.</p>
        <p>9.3 Der Nutzer sichert zu, dass die von ihm eingebrachten Inhalte keine Rechte Dritter verletzen und keine rechtswidrigen Inhalte darstellen.</p>
      </section>

      <section>
        <h2>10. Laufzeit und Kündigung</h2>
        <p>10.1 Unentgeltliche Nutzungsverhältnisse laufen auf unbestimmte Zeit und können von beiden Seiten jederzeit mit Wirkung für die Zukunft gekündigt werden, sofern nicht etwas anderes vereinbart ist.</p>
        <p>10.2 Kostenpflichtige Verträge laufen für die jeweils gebuchte Vertragslaufzeit und verlängern sich nur nach Maßgabe der im Bestellprozess oder in den besonderen Subscription-Bedingungen ausgewiesenen Regelungen.</p>
        <p>10.3 Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.</p>
        <p>10.4 Nach Vertragsende kann der Zugang zu kostenpflichtigen Funktionen beendet oder eingeschränkt werden. Gesetzliche Aufbewahrungspflichten bleiben unberührt.</p>
      </section>

      <section>
        <h2>11. Sperrung und außerordentliche Beendigung</h2>
        <p>11.1 Der Anbieter ist berechtigt, den Zugang vorübergehend zu sperren oder das Vertragsverhältnis außerordentlich zu kündigen, wenn:</p>
        <ul>
          <li>der Nutzer schwerwiegend gegen diese AGB verstößt,</li>
          <li>ein Missbrauch der Plattform vorliegt,</li>
          <li>Zahlungsrückstände bestehen,</li>
          <li>Rechte Dritter oder die Sicherheit der Plattform gefährdet sind.</li>
        </ul>
        <p>11.2 Soweit zumutbar, wird der Nutzer vorab informiert und erhält Gelegenheit zur Stellungnahme oder Abhilfe.</p>
      </section>

      <section>
        <h2>12. Gesetzliche Rechte bei Mängeln</h2>
        <p>12.1 Für Verbraucher gelten bei kostenpflichtigen digitalen Leistungen die gesetzlichen Vorschriften, insbesondere zu digitalen Produkten.</p>
        <p>12.2 Für Unternehmer gelten die gesetzlichen Vorschriften, soweit in diesen AGB nichts Wirksames abweichend geregelt ist.</p>
        <p>12.3 Etwaige Garantien bestehen nur, wenn sie ausdrücklich und schriftlich zugesagt wurden.</p>
      </section>

      <section>
        <h2>13. Haftung</h2>
        <p>13.1 Der Anbieter haftet unbeschränkt:</p>
        <ul>
          <li>bei Vorsatz und grober Fahrlässigkeit,</li>
          <li>bei Verletzung von Leben, Körper oder Gesundheit,</li>
          <li>nach dem Produkthaftungsgesetz,</li>
          <li>in allen Fällen zwingender gesetzlicher Haftung.</li>
        </ul>
        <p>13.2 Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Wesentliche Vertragspflichten sind solche Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Nutzer regelmäßig vertrauen darf.</p>
        <p>13.3 Im Übrigen ist eine Haftung bei leichter Fahrlässigkeit ausgeschlossen.</p>
        <p>13.4 Die vorstehenden Haftungsbeschränkungen gelten auch zugunsten der gesetzlichen Vertreter, Mitarbeitenden und Erfüllungsgehilfen des Anbieters.</p>
      </section>

      <section>
        <h2>14. Datenschutz</h2>
        <p>14.1 Informationen zur Verarbeitung personenbezogener Daten enthält die Datenschutzerklärung.</p>
        <p>14.2 Der Nutzer bleibt für personenbezogene Daten, die er rechtswidrig oder ohne erforderliche Berechtigung über die Plattform verarbeitet, selbst verantwortlich, soweit der Anbieter nicht selbst Verantwortlicher dieser Verarbeitung ist.</p>
      </section>

      <section>
        <h2>15. Änderungen von Leistungen und AGB</h2>
        <p>15.1 Der Anbieter kann diese AGB anpassen, wenn hierfür ein sachlicher Grund besteht, insbesondere bei Änderungen der Rechtslage, bei neuen technischen Entwicklungen, bei Sicherheitsanforderungen oder bei Änderungen des Leistungsangebots.</p>
        <p>15.2 Änderungen dürfen den Nutzer nicht unangemessen benachteiligen.</p>
        <p>15.3 Über wesentliche Änderungen wird der Nutzer rechtzeitig informiert. Sofern eine Änderung für den Nutzer nicht zumutbar ist, steht ihm ein Recht zur Kündigung zum Zeitpunkt des Wirksamwerdens der Änderung zu.</p>
        <p>15.4 Gesetzliche Rechte von Verbrauchern bleiben unberührt.</p>
      </section>

      <section>
        <h2>16. Schlussbestimmungen</h2>
        <p>16.1 Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gegenüber Verbrauchern gilt diese Rechtswahl nur, soweit dadurch keine zwingenden gesetzlichen Vorschriften des Staates eingeschränkt werden, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat.</p>
        <p>16.2 Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist der Gerichtsstand soweit gesetzlich zulässig der Sitz des Anbieters.</p>
        <p>16.3 Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Anstelle der unwirksamen Regelung gelten die gesetzlichen Vorschriften.</p>
      </section>
    </LegalPageShell>
  );
}