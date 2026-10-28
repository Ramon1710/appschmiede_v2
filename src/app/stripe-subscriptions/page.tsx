import Link from 'next/link';
import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Hinweis zu früheren Zahlungsfunktionen',
  description: 'Die aktuelle AppSchmiede-Nutzung ist kostenlos. Frühere Zahlungsvorgänge sind gesondert zu klären.',
  robots: { index: false, follow: true },
};

export default function StripeSubscriptionsPage() {
  return (
    <LegalPageShell title="Hinweis zu früheren Zahlungsfunktionen" subtitle="Kein aktuelles Abonnementangebot" updatedAt="28.10.2026">
      <section>
        <h2>Kostenlose Vereinsplattform</h2>
        <p>AppSchmiede ist für freigeschaltete Mitglieder und Partner von Headbang Handwerk e. V. einschließlich KI kostenlos. Für diese Nutzung gibt es keine nutzerseitige Coin-Abrechnung, keine kostenpflichtigen App-Tarife und keine neu vereinbarten automatischen kostenpflichtigen Verlängerungen.</p>
        <p>Die früher an dieser Adresse veröffentlichten allgemeinen Hinweise zu Stripe-Abonnements beschreiben kein aktuelles Angebot mehr. Für die kostenlose Nutzung gelten die <Link href="/agb" className="underline decoration-dotted">Nutzungsbedingungen</Link>.</p>
      </section>
      <section>
        <h2>Frühere Vorgänge gesondert klären</h2>
        <p>Diese Seite ist kein Vertragsarchiv und ersetzt keine tatsächlich für einen früheren Vorgang vereinbarten Bedingungen. Sie bestätigt weder das Bestehen noch die Beendigung eines historischen Abonnements und ändert keine bestehenden Ansprüche oder Aufbewahrungspflichten.</p>
        <p>Falls Sie frühere Zahlungsbelege oder einen bestehenden Zahlungsvorgang klären möchten, wenden Sie sich bitte an <a href="mailto:info@headbang-handwerk.de" className="underline decoration-dotted">info@headbang-handwerk.de</a>. Die Umstellung der Website löscht keine Zahlungsdaten und kündigt keine externen Verträge.</p>
        <p>Weitere Informationen: <Link href="/datenschutz" className="underline decoration-dotted">Datenschutzerklärung</Link> und <Link href="/impressum" className="underline decoration-dotted">Impressum</Link>.</p>
      </section>
    </LegalPageShell>
  );
}
