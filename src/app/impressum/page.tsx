export default function Impressum() {
	return (
		<main className="mx-auto max-w-3xl space-y-3 p-8 text-sm leading-6">
			<h1 className="text-3xl font-semibold mb-4">Impressum</h1>
			<p>Angaben gemäß § 5 TMG</p>
			<p>
				R. Meyer<br />
				Beethovenstraße 3<br />
				26810 Westoverledingen
			</p>
			<p>E-Mail: <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a></p>
			<p>Telefon: Auf Anfrage</p>
			<p>USt-IdNr.: wird aktuell nicht vergeben (Kleinunternehmer gemäß § 19 UStG)</p>
			<h2 className="text-xl font-semibold mt-6">Verantwortlich für den Inhalt</h2>
			<p>R. Meyer – AppSchmiede</p>
			<p className="text-xs text-neutral-500">Stand: November 2025</p>
		</main>
	);
}