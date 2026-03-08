import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Stripe-Subscriptions',
  description: 'Zusatzbedingungen für wiederkehrende Abonnements über Stripe auf myappschmiede.com.',
};

export default function StripeSubscriptionsPage() {
  return (
    <LegalPageShell
      title="Terms of Service für Stripe-Subscriptions"
      subtitle="für myappschmiede.com"
      updatedAt="08.03.2026"
    >
      <section>
        <h2>1. Geltungsbereich</h2>
        <p>1.1 Diese Bedingungen regeln ergänzend zu den allgemeinen AGB den Abschluss und die Durchführung kostenpflichtiger, wiederkehrender Abonnements über Stripe.</p>
        <p>1.2 Sie gelten für alle Abonnements, die über myappschmiede.com oder einen damit verbundenen Stripe-Checkout abgeschlossen werden.</p>
        <p>1.3 Für einmalige Käufe oder Guthaben- beziehungsweise Paketkäufe gelten diese Bedingungen nur, soweit dies im jeweiligen Angebot ausdrücklich so angegeben ist.</p>
      </section>

      <section>
        <h2>2. Vertragspartner</h2>
        <p>Vertragspartner für das Abonnement ist:</p>
        <p>
          Ramon Meyer<br />
          Einzelunternehmer<br />
          Beethovenstraße 3<br />
          26810 Westoverledingen<br />
          Deutschland<br />
          E-Mail: <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>
        </p>
        <p>Die Zahlungsabwicklung erfolgt über Stripe als Zahlungsdienstleister.</p>
      </section>

      <section>
        <h2>3. Vertragsschluss</h2>
        <p>3.1 Die Darstellung von Abonnements, Tarifen und Preisen stellt noch kein verbindliches Angebot dar, sondern eine Aufforderung zur Abgabe einer Bestellung.</p>
        <p>3.2 Ein Abonnement kommt zustande, wenn der Nutzer im Checkout den Bestellvorgang abschließt und der Anbieter die Buchung annimmt, insbesondere durch Anzeige einer erfolgreichen Buchung, Zusendung einer Bestätigung per E-Mail oder Freischaltung des gebuchten Tarifs.</p>
        <p>3.3 Vor Abschluss des Abonnements werden dem Nutzer insbesondere angezeigt Leistungsumfang des Tarifs, Gesamtpreis, Abrechnungsintervall, Laufzeit beziehungsweise Verlängerungslogik und Zahlungsart.</p>
      </section>

      <section>
        <h2>4. Preise, Abrechnung und Steuern</h2>
        <p>4.1 Es gelten die im Zeitpunkt der Bestellung im Checkout angezeigten Preise.</p>
        <p>4.2 Abgerechnet wird nach dem im Checkout ausgewählten Intervall, zum Beispiel monatlich oder jährlich.</p>
        <p>4.3 Ob Preise einschließlich oder zuzüglich gesetzlicher Umsatzsteuer ausgewiesen werden, richtet sich nach der jeweiligen Angebotsdarstellung im Checkout und der rechtlichen Einordnung des Angebots.</p>
        <p>4.4 Rechnungen und Belege können elektronisch bereitgestellt werden.</p>
      </section>

      <section>
        <h2>5. Zahlungsabwicklung über Stripe</h2>
        <p>5.1 Die Zahlungsabwicklung erfolgt über Stripe. Es können die von Stripe im Checkout angebotenen Zahlungsmethoden zur Verfügung stehen.</p>
        <p>5.2 Für die technische Zahlungsabwicklung und die Verarbeitung zahlungsbezogener Daten können ergänzend die Nutzungs- und Datenschutzbedingungen von Stripe gelten.</p>
        <p>5.3 Der Anbieter erhält von Stripe die für Vertragsdurchführung, Buchhaltung, Support und Missbrauchsprävention erforderlichen abrechnungsbezogenen Informationen.</p>
      </section>

      <section>
        <h2>6. Laufzeit und automatische Verlängerung</h2>
        <p>6.1 Das Abonnement läuft für das im Checkout angegebene Abrechnungsintervall.</p>
        <p>6.2 Soweit im Angebot nichts anderes angegeben ist, verlängert sich das Abonnement automatisch jeweils um das zuletzt gebuchte Intervall, wenn es nicht rechtzeitig zum Ende der laufenden Periode gekündigt wird.</p>
        <p>6.3 Der konkrete nächste Abrechnungszeitpunkt richtet sich nach den im Nutzerkonto, in der Bestätigungs-E-Mail oder im Stripe-Checkout ausgewiesenen Daten.</p>
      </section>

      <section>
        <h2>7. Tarifwechsel</h2>
        <p>7.1 Upgrades, Downgrades oder Wechsel zwischen Tarifen sind im Rahmen der technisch angebotenen Möglichkeiten zulässig.</p>
        <p>7.2 Ob und in welchem Umfang dabei eine sofortige Anpassung, eine anteilige Verrechnung oder eine Änderung erst zum Ende des laufenden Intervalls erfolgt, richtet sich nach der im Bestell- oder Änderungsprozess ausgewiesenen Regelung.</p>
      </section>

      <section>
        <h2>8. Fehlgeschlagene Zahlungen</h2>
        <p>8.1 Schlägt eine Zahlung fehl, kann der Anbieter den Nutzer hierüber informieren und erneute Einziehungs- oder Zahlungsversuche veranlassen, soweit dies zulässig ist.</p>
        <p>8.2 Der Anbieter ist berechtigt, den Zugang zu kostenpflichtigen Funktionen nach erfolgloser Zahlung vorübergehend einzuschränken oder zu sperren, wenn die Forderung trotz Fälligkeit offen bleibt.</p>
        <p>8.3 Weitergehende gesetzliche oder vertragliche Ansprüche des Anbieters bleiben unberührt.</p>
      </section>

      <section>
        <h2>9. Kündigung</h2>
        <p>9.1 Der Nutzer kann ein Abonnement jederzeit mit Wirkung zum Ende des laufenden Abrechnungszeitraums kündigen, sofern im Angebot nichts Abweichendes angegeben ist.</p>
        <p>9.2 Die Kündigung kann soweit technisch vorgesehen im Nutzerkonto, über einen bereitgestellten Kündigungsweg oder über den gesetzlich erforderlichen Kündigungsbutton erklärt werden.</p>
        <p>9.3 Nach Wirksamwerden der Kündigung bleibt der Zugang zu bereits bezahlten Leistungen grundsätzlich bis zum Ende des laufenden Abrechnungszeitraums bestehen.</p>
        <p>9.4 Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.</p>
      </section>

      <section>
        <h2>10. Erstattungen</h2>
        <p>10.1 Bereits gezahlte Entgelte werden grundsätzlich nicht anteilig erstattet, wenn der Nutzer das Abonnement vor Ablauf des bereits bezahlten Zeitraums kündigt.</p>
        <p>10.2 Gesetzliche Ansprüche, insbesondere im Falle eines wirksamen Widerrufs, eines Rücktritts, einer berechtigten Minderung oder anderer zwingender gesetzlicher Rückzahlungsansprüche, bleiben unberührt.</p>
        <p>10.3 Kulanzregelungen des Anbieters bleiben vorbehalten.</p>
      </section>

      <section>
        <h2>11. Preis- und Leistungsänderungen</h2>
        <p>11.1 Der Anbieter kann Preise und Leistungsumfang für zukünftige Abrechnungszeiträume anpassen, wenn hierfür ein sachlicher Grund besteht, insbesondere bei Änderungen von Marktbedingungen, Funktionsumfang, Kostenstruktur, gesetzlichen Vorgaben oder externen Dienstleisterkosten.</p>
        <p>11.2 Über wesentliche Änderungen wird der Nutzer rechtzeitig vor dem Wirksamwerden informiert.</p>
        <p>11.3 Preisänderungen gelten nur für zukünftige Verlängerungszeiträume. Dem Nutzer steht in diesem Fall das Recht zu, das Abonnement bis zum Wirksamwerden der Änderung zu kündigen.</p>
      </section>

      <section>
        <h2>12. Widerrufsrecht für Verbraucher</h2>
        <p>12.1 Verbrauchern steht bei Fernabsatzverträgen grundsätzlich ein gesetzliches Widerrufsrecht zu.</p>
        <p>12.2 Die Einzelheiten des Widerrufsrechts, der Widerrufsfrist, der Rechtsfolgen des Widerrufs sowie das Muster-Widerrufsformular werden Verbrauchern vor Vertragsschluss gesondert zur Verfügung gestellt.</p>
        <p>12.3 Gesetzliche Regelungen zu Wertersatz, Sofortbeginn der Leistung und digitalen Leistungen bleiben unberührt.</p>
      </section>

      <section>
        <h2>13. Verhältnis zu den allgemeinen AGB</h2>
        <p>Im Übrigen gelten die allgemeinen AGB von myappschmiede.com. Bei Widersprüchen gehen diese Subscription-Bedingungen für kostenpflichtige wiederkehrende Abonnements vor.</p>
      </section>

      <section>
        <h2>14. Schlussbestimmungen</h2>
        <p>Es gilt deutsches Recht mit den in den allgemeinen AGB geregelten Einschränkungen zugunsten von Verbrauchern.</p>
      </section>
    </LegalPageShell>
  );
}