export default function Datenschutz() {
	return (
		<main className="mx-auto max-w-3xl space-y-6 p-8 text-sm leading-6">
			<h1 className="text-3xl font-semibold">Datenschutzerklärung</h1>

			<section>
				<h2 className="text-xl font-semibold">1. Verantwortlicher</h2>
				<p>
					Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website ist R. Meyer, Beethovenstraße 3, 26810
					Westoverledingen, E-Mail: <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>.
				</p>
			</section>

			<section>
				<h2 className="text-xl font-semibold">2. Hosting & Infrastruktur</h2>
				<p>
					Die Website wird über Vercel (Vercel Inc.) ausgeliefert. Zusätzlich nutzen wir Firebase Authentication, Firestore und Firebase
					Storage (Google Ireland Ltd., Gordon House, Barrow Street, Dublin 4). Dabei kann es zu Übermittlungen in Drittländer kommen.
					Google setzt EU-Standardvertragsklauseln ein.
				</p>
			</section>

			<section>
				<h2 className="text-xl font-semibold">3. Verarbeitete Daten</h2>
				<ul className="list-disc pl-6">
					<li>Server-Logfiles (IP-Adresse, Timestamp, User-Agent) zur technischen Bereitstellung.</li>
					<li>Registrierungs- und Login-Daten (Name, E-Mail, Passwort-Hash) in Firebase Authentication.</li>
					<li>Profil- und Projektdaten in Firestore (z. B. Firmenname, Telefonnummer, Projektinhalte).</li>
					<li>Editor-Inhalte und Uploads in Firebase Storage.</li>
				</ul>
			</section>

			<section>
				<h2 className="text-xl font-semibold">4. Zwecke & Rechtsgrundlagen</h2>
				<p>
					Die Verarbeitung erfolgt zur Vertragserfüllung bzw. Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO) sowie
					zur technischen Sicherheit und Optimierung (Art. 6 Abs. 1 lit. f DSGVO). Sofern eine Einwilligung erforderlich ist, erfolgt die
					Verarbeitung auf Basis von Art. 6 Abs. 1 lit. a DSGVO.
				</p>
			</section>

			<section>
				<h2 className="text-xl font-semibold">5. Speicherdauer</h2>
				<p>Wir löschen personenbezogene Daten, sobald der Zweck entfällt oder gesetzliche Aufbewahrungsfristen ablaufen.</p>
			</section>

			<section>
				<h2 className="text-xl font-semibold">6. Ihre Rechte</h2>
				<p>
					Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.
					Außerdem steht Ihnen ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde zu. Kontaktieren Sie uns dazu unter den oben
					genannten Angaben.
				</p>
			</section>

			<section>
				<h2 className="text-xl font-semibold">7. Kontakt</h2>
				<p>
					Für Anfragen genügt eine E-Mail an <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>.
				</p>
			</section>

			<p className="text-xs text-neutral-500">Stand: November 2025</p>
		</main>
	);
}