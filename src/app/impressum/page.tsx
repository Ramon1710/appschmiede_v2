import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
	title: 'Impressum',
	description: 'Impressum von Headbang Handwerk e. V. gemäß § 5 DDG für die AppSchmiede.',
};

export default function Impressum() {
	return (
		<LegalPageShell title="Impressum" subtitle="Angaben gemäß § 5 DDG" updatedAt="28.10.2026">
			<section>
				<p>
					Headbang Handwerk e. V.<br />
					Wiesengrund 5<br />
					26203 Wardenburg<br />
					Deutschland
				</p>
			</section>

			<section>
				<h2>Vertreten durch den Vorstand</h2>
				<p>
					Daniel Bigl<br />
					Ramon Meyer<br />
					Melanie Stephan
				</p>
			</section>

			<section>
				<h2>Kontakt</h2>
				<p>
					E-Mail: <a className="underline decoration-dotted" href="mailto:info@headbang-handwerk.de">info@headbang-handwerk.de</a>
				</p>
				<p>
					Internet: <a className="break-words underline decoration-dotted" href="https://www.headbang-handwerk.com/" target="_blank" rel="noopener noreferrer">https://www.headbang-handwerk.com/</a>
				</p>
			</section>

			<section>
				<h2>Vereinsregister</h2>
				<p>Registergericht: Oldenburg</p>
				<p>Registernummer: VR 203027</p>
			</section>

			<section>
				<h2>Gemeinnützigkeit</h2>
				<p>Als gemeinnützig anerkannt gemäß Bescheid des Finanzamts vom 18.06.2026.</p>
				<p>Steuernummer: 64/220/24081</p>
			</section>

			<section>
				<h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
				<p>
					Melanie Stephan<br />
					Wiesengrund 5<br />
					26203 Wardenburg
				</p>
			</section>

			<section>
				<h2>Haftung für Inhalte</h2>
				<p>Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
			</section>

			<section>
				<h2>Haftung für Links</h2>
				<p>Unsere Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>
			</section>

			<section>
				<h2>Urheberrecht</h2>
				<p>Die durch den Verein erstellten Inhalte und Werke auf dieser Website unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung oder sonstige Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der vorherigen schriftlichen Zustimmung des jeweiligen Urhebers bzw. Erstellers.</p>
			</section>
		</LegalPageShell>
	);
}