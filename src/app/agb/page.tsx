import Link from 'next/link';
import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'AGB',
  description: 'Nutzungsbedingungen der kostenlosen, einladungsbasierten AppSchmiede von Headbang Handwerk e. V.',
};

export default function AgbPage() {
  return (
    <LegalPageShell title="Allgemeine Geschäftsbedingungen (AGB)" subtitle="Kostenlose AppSchmiede für freigeschaltete Mitglieder und Partner" updatedAt="28.10.2026">
      <section>
        <h2>1. Anbieter und Geltungsbereich</h2>
        <p>Diese Bedingungen regeln die Nutzung der AppSchmiede durch autorisierte Mitglieder und Partner von Headbang Handwerk e. V. Anbieter ist:</p>
        <p>
          Headbang Handwerk e. V.<br />
          Wiesengrund 5<br />
          26203 Wardenburg<br />
          Deutschland
        </p>
        <p>Vertreten durch den Vorstand: Daniel Bigl, Ramon Meyer und Melanie Stephan. Vereinsregister: Amtsgericht Oldenburg, VR 203027.</p>
        <p>E-Mail: <a href="mailto:info@headbang-handwerk.de" className="underline decoration-dotted">info@headbang-handwerk.de</a>. Weitere Anbieterangaben: <Link href="/impressum" className="underline decoration-dotted">Impressum</Link>.</p>
        <p>Die Freischaltung der Plattform ersetzt weder eine Vereinsmitgliedschaft noch eine gesonderte Partnervereinbarung. Gesetzliche Rechte, insbesondere zwingende Rechte von Verbrauchern, bleiben unberührt.</p>
      </section>

      <section>
        <h2>2. Persönliche Einladung und Zugang</h2>
        <p>Neue Konten erhalten ausschließlich über einen gültigen persönlichen Einladungslink und die zugeordnete E-Mail-Adresse Zugang. Eine öffentliche Registrierung ist nicht vorgesehen. Einladungen sind befristet und nur einmal einlösbar. Die Administration verwaltet Freigaben; ein allgemeiner Anspruch auf Einladung oder Aufnahme in den Verein entsteht durch diese Bedingungen nicht.</p>
        <p>Konten sind personenbezogen. Zugangsdaten und Einladungslinks dürfen nicht an Dritte weitergegeben werden. Angaben müssen zutreffend sein; Änderungen sind im Profil zu pflegen. Bei vermutetem unbefugtem Zugriff ist der Verein zeitnah zu informieren. Passwörter dürfen nicht an die Administration oder den Support versandt werden.</p>
        <p>Die vereinbarte Nutzung setzt eine erfolgreiche Einladung und Freischaltung voraus. Diese Bedingungen sollen vor Aufnahme der Nutzung zugänglich gemacht und wirksam einbezogen werden. Eine automatische rechtswirksame Annahme allein durch den technischen Registrierungsablauf wird hierdurch nicht behauptet.</p>
      </section>

      <section>
        <h2>3. Vollständig kostenloses Nutzungsmodell</h2>
        <p><strong>Die Nutzung der AppSchmiede ist für freigeschaltete Mitglieder und Partner kostenlos.</strong> Das umfasst die verfügbaren Editor-, Vorlagen- und KI-Funktionen. Es gibt keine nutzerseitige Coin-Abrechnung, keine kostenpflichtigen App-Tarife und keine automatischen kostenpflichtigen Abonnementverlängerungen für diese Nutzung. Die Kostenfreiheit ist nicht auf eine Einführungsphase begrenzt.</p>
        <p>Technische Altfelder zu Plänen oder Guthaben begründen keine Zahlungspflicht. Eine spätere Änderung in ein entgeltliches Angebot wäre keine automatische Folge dieser Bedingungen und bedürfte einer gesonderten wirksamen Vereinbarung. Bestehende eigenständige Vereins- oder Partnervereinbarungen werden durch die kostenlose Plattformnutzung nicht geändert.</p>
      </section>

      <section>
        <h2>4. Funktionen und Leistungsgrenzen</h2>
        <p>Die Plattform unterstützt Projektverwaltung, einen visuellen App-Editor, Bausteine, fertige Buttons, Vorlagen, KI-gestützte Erzeugung sowie Vorschau- und Exportfunktionen, soweit diese im jeweiligen Arbeitsbereich bereitgestellt sind. Berechtigte Administratoren können zentrale Vorlagen verwalten. Vorschauen und Exporte sind Hilfsmittel zur Entwicklung und Prüfung; sie garantieren weder einen produktionsreifen Betrieb noch eine Zulassung in einem App-Store.</p>
        <p>KI-Ausgaben können je nach Konfiguration aus externen Diensten oder lokaler Vorlagenlogik stammen. Die Verfügbarkeit einzelner Drittanbieter ist nicht allein vom Verein steuerbar. Eine unbegrenzte technische Kapazität, ein bestimmtes wirtschaftliches Ergebnis oder eine bestimmte Mindestverfügbarkeit wird nicht zugesagt. Gesetzliche Leistungspflichten und ausdrücklich getroffene Vereinbarungen bleiben maßgeblich.</p>
        <p>Wartung, technische Störungen und notwendige Schutzmaßnahmen können den Dienst einschränken. Wesentliche geplante Einschränkungen sollen nach Möglichkeit rechtzeitig angekündigt werden. Änderungen dürfen berechtigte Interessen nicht unangemessen beeinträchtigen und bestehende Pflichten nicht beliebig entfallen lassen.</p>
      </section>

      <section>
        <h2>5. Zulässige Nutzung und Schutz anderer</h2>
        <ul>
          <li>Die Plattform darf nur für rechtmäßige, vom jeweiligen Zugang gedeckte Zwecke genutzt werden.</li>
          <li>Rechtswidrige Inhalte, Täuschung, Belästigung, Schadsoftware und Verletzungen von Urheber-, Persönlichkeits- oder Datenschutzrechten sind untersagt.</li>
          <li>Technische Schutzmaßnahmen, Rollenprüfungen, Zugriffsbeschränkungen und Missbrauchsschutz dürfen nicht umgangen werden.</li>
          <li>Fremde Daten dürfen nur mit entsprechender Berechtigung und Rechtsgrundlage verarbeitet werden. Vertrauliche oder sensible Daten dürfen nicht ungeprüft an externe KI- oder Mediendienste gelangen.</li>
          <li>Exporte und Sicherungen sind rechtzeitig vorzunehmen, soweit dies zumutbar und technisch angeboten ist. Dies hebt gesetzliche Pflichten des Vereins nicht auf.</li>
        </ul>
      </section>

      <section>
        <h2>6. KI-generierte Inhalte</h2>
        <p>KI-Ergebnisse können sachliche Fehler, unpassende Inhalte oder Rechte Dritter betreffen. Sie sind vor einer relevanten Verwendung auf Richtigkeit, Eignung, Sicherheit und Rechte Dritter zu prüfen. Die Plattform ersetzt keine fachkundige rechtliche, medizinische, technische oder sonstige Beratung.</p>
        <p>Es wird weder die Einzigartigkeit noch die Schutzfähigkeit oder Rechtefreiheit einer KI-Ausgabe garantiert. Rechtswidrige oder missbräuchliche Nutzung ist untersagt. Für Eingaben und die spätere Verwendung gelten die gesetzlichen Verantwortlichkeiten. Informationen zu tatsächlichen externen Empfängern und offenen Anbieterfragen enthält die <Link href="/datenschutz" className="underline decoration-dotted">Datenschutzerklärung</Link>.</p>
      </section>

      <section>
        <h2>7. Nutzungsrechte, eigene Projekte und Vorlagen</h2>
        <p>Freigeschaltete Personen dürfen die Plattform im vereinbarten Umfang für die Dauer ihres Zugangs nutzen. Rechte an der Plattformsoftware und fremden Bestandteilen werden nicht pauschal übertragen. Lizenzen für enthaltene Drittinhalte, Bibliotheken oder Medien sind auch bei Exporten zu beachten.</p>
        <p>Rechte an selbst eingebrachten Projekten und Inhalten verbleiben bei den jeweiligen Rechteinhabern. Der Verein erhält nur die zur vereinbarten Speicherung, technischen Verarbeitung, Darstellung, Sicherung und berechtigten Zusammenarbeit erforderlichen Nutzungsrechte. Eine Verwendung für fremde Werbe- oder Trainingszwecke wird damit nicht pauschal eingeräumt.</p>
        <p>Wer eine Vorlage für weitere Beteiligte freigibt, muss über die dafür notwendigen Rechte verfügen. Projektfreigaben und zentrale Vorlagen können anderen berechtigten Personen zugänglich sein. Ein Export verschafft keine zusätzlichen Rechte an fremden Inhalten.</p>
      </section>

      <section>
        <h2>8. Kontolöschung und Beendigung des Zugangs</h2>
        <p>Nutzer können die Nutzung jederzeit einstellen und ihr Konto über die bestätigte Löschfunktion oder durch eine Anfrage an den Verein löschen lassen. Der Verein kann Freigaben bei Wegfall der Zugangsberechtigung oder aus sachlichem Grund beenden. Soweit möglich und zumutbar, erfolgt zuvor eine Information mit Gelegenheit, benötigte eigene Inhalte zu exportieren. Gesetzliche Rechte zur Beendigung aus wichtigem Grund bleiben bestehen.</p>
        <p>Bei konkretem Missbrauch oder einer Sicherheitsgefahr kann der Zugang vorübergehend gesperrt werden. Maßnahmen müssen verhältnismäßig sein; soweit die Situation es zulässt, werden Gründe mitgeteilt und eine Klärung ermöglicht. Eine Rolle oder Freigabe darf nicht durch eigenmächtige Änderungen umgangen werden.</p>
        <p>Eine Kontolöschung entfernt das Authentifizierungskonto und das eigene Profildokument. Projekte, gemeinsame Inhalte, Dateien, Nachrichten und Einladungsnachweise werden technisch nicht automatisch vollständig mitgelöscht. Das ist keine pauschale Aufbewahrungsberechtigung: Datenschutzrechtliche Löschansprüche, erforderliche Aufbewahrung und Rechte anderer Beteiligter sind gesondert zu prüfen. Bitte klären Sie Projektübergabe und weitergehende Löschwünsche mit dem Verein.</p>
      </section>

      <section>
        <h2>9. Datenschutz und Kommunikation</h2>
        <p>Die <Link href="/datenschutz" className="underline decoration-dotted">Datenschutzerklärung</Link> und die <Link href="/datenschutz/firebase" className="underline decoration-dotted">Firebase-Hinweise</Link> beschreiben die Verarbeitung personenbezogener Daten. Diese Informationen ersetzen keine erforderliche Einwilligung oder Auftragsverarbeitungsvereinbarung.</p>
        <p>Technische und zugangsbezogene Mitteilungen können an die zum Konto gehörende E-Mail-Adresse gesendet werden. Für Fragen zu Zugang, eigenen Daten und Projekten steht <a href="mailto:info@headbang-handwerk.de" className="underline decoration-dotted">info@headbang-handwerk.de</a> zur Verfügung.</p>
      </section>

      <section>
        <h2>10. Gesetzliche Ansprüche und Haftung</h2>
        <p>Es gelten die gesetzlichen Vorschriften unter Berücksichtigung der unentgeltlichen Bereitstellung. Die Kostenfreiheit schließt gesetzliche Ansprüche nicht pauschal aus. Soweit Vorschriften über digitale Produkte, Verbraucherschutz oder Datenschutz anwendbar sind, bleiben sie unberührt.</p>
        <p>Die Haftung für Vorsatz und grobe Fahrlässigkeit, für Schäden aus der Verletzung von Leben, Körper oder Gesundheit, aus einer übernommenen Garantie sowie nach dem Produkthaftungsgesetz und sonstigem zwingenden Recht wird nicht ausgeschlossen oder beschränkt. Ein pauschaler Haftungsausschluss für die Plattform, KI-Ergebnisse oder Datenverlust wird nicht vereinbart.</p>
      </section>

      <section>
        <h2>11. Änderungen und Schlussbestimmungen</h2>
        <p>Notwendige Änderungen des Angebots oder dieser Bedingungen werden nachvollziehbar erläutert und in angemessener Weise mitgeteilt. Wesentliche Vertragsänderungen bedürfen einer wirksamen Vereinbarung, soweit gesetzlich erforderlich. Schweigen allein gilt nicht als pauschale Zustimmung; insbesondere können daraus keine neuen Zahlungspflichten entstehen.</p>
        <p>Es gilt deutsches Recht. Zwingende Schutzvorschriften, die insbesondere Verbrauchern nach dem Recht ihres gewöhnlichen Aufenthalts zustehen, werden dadurch nicht eingeschränkt. Es wird kein ausschließlicher Gerichtsstand zulasten von Verbrauchern vereinbart. Soweit eine Regelung unwirksam ist, gelten die gesetzlichen Bestimmungen; die übrigen Regelungen bleiben im gesetzlich vorgesehenen Umfang bestehen.</p>
      </section>

      <section>
        <h2>12. Redaktioneller Stand und rechtliche Freigabe</h2>
        <p>Vor der verbindlichen Verwendung sind insbesondere die wirksame Einbeziehung der Bedingungen in Einladung und Registrierung, die konkrete Vereins- beziehungsweise Partnerbeziehung, der zulässige Nutzerkreis, mögliche Verbraucherschutzpflichten bei digitalen Produkten, das Lösch- und Projektübergabeverfahren sowie die Drittanbieter- und KI-Bedingungen rechtlich zu prüfen. Dieser Text ist keine Bestätigung einer bereits erfolgten juristischen Prüfung oder Zustimmung aller Bestandsnutzer.</p>
      </section>
    </LegalPageShell>
  );
}
