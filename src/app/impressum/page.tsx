import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
	title: 'Impressum',
	description: 'Impressum gemäß § 5 DDG für myappschmiede.com.',
};

export default function Impressum() {
	return (
		<LegalPageShell title="Impressum" subtitle="Angaben gemäß § 5 DDG" updatedAt="08.03.2026">
			<section>
				<p>
					Ramon Meyer<br />
					Einzelunternehmer<br />
					Beethovenstraße 3<br />
					26810 Westoverledingen<br />
					Deutschland
				</p>
			</section>

			<section>
				<h2>Kontakt</h2>
				<p>
					E-Mail: <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>
				</p>
			</section>

			<section>
				<h2>Verbraucherstreitbeilegung</h2>
				<p>Ich bin nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
			</section>
		</LegalPageShell>
	);
}