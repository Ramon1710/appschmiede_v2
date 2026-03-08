import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
	title: 'Datenschutzerklärung',
	description: 'Datenschutzerklärung für myappschmiede.com mit Vercel, Firebase, Stripe und Consent-Einstellungen.',
};

export default function Datenschutz() {
	return (
		<LegalPageShell
			title="Datenschutzerklärung"
			subtitle="für myappschmiede.com"
			updatedAt="08.03.2026"
		>
			<section>
				<h2>1. Verantwortlicher</h2>
				<p>
					Verantwortlicher für die Datenverarbeitung auf dieser Website und in der Web-App ist:
				</p>
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
				<h2>2. Allgemeine Hinweise zur Datenverarbeitung</h2>
				<p>Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung unserer Website und Web-App, zur Einrichtung und Durchführung von Nutzerkonten, zur Zahlungsabwicklung, zur Sicherstellung der technischen Sicherheit und soweit Sie eingewilligt haben zur Analyse und Optimierung unseres Angebots erforderlich ist.</p>
				<p>Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen.</p>
			</section>

			<section>
				<h2>3. Aufruf der Website und Hosting</h2>
				<p>Für das Hosting und die technische Bereitstellung unserer Website und Web-App nutzen wir Vercel.</p>
				<p>Beim Aufruf unserer Website werden technisch erforderliche Verbindungs- und Protokolldaten verarbeitet, insbesondere:</p>
				<ul>
					<li>IP-Adresse</li>
					<li>Datum und Uhrzeit des Abrufs</li>
					<li>Browsertyp und Browserversion</li>
					<li>Betriebssystem</li>
					<li>angeforderte Inhalte</li>
					<li>Referrer-URL</li>
					<li>Statuscodes und technische Ereignisse</li>
				</ul>
				<p>Die Verarbeitung erfolgt zur Bereitstellung der Website, zur Gewährleistung von Stabilität und Sicherheit sowie zur Fehleranalyse.</p>
				<p>Rechtsgrundlage:</p>
				<p>Art. 6 Abs. 1 lit. f DSGVO</p>
				<p>Soweit auf Ihrem Endgerät technisch notwendige Informationen gespeichert oder ausgelesen werden, erfolgt dies auf Grundlage von § 25 Abs. 2 TDDDG.</p>
			</section>

			<section>
				<h2>4. Registrierung und Nutzerkonto</h2>
				<p>Sie können auf myappschmiede.com ein Nutzerkonto anlegen. Dabei verarbeiten wir folgende Daten:</p>
				<h3>Pflichtangaben</h3>
				<ul>
					<li>Vorname</li>
					<li>Nachname</li>
					<li>E-Mail-Adresse</li>
					<li>Passwort</li>
				</ul>
				<h3>Optionale Angaben</h3>
				<ul>
					<li>Unternehmen beziehungsweise Firmenname</li>
					<li>Profilbild</li>
				</ul>
				<p>Diese Daten verwenden wir, um:</p>
				<ul>
					<li>Ihr Nutzerkonto anzulegen und zu verwalten</li>
					<li>Ihnen den Login zu ermöglichen</li>
					<li>vertragliche Leistungen bereitzustellen</li>
					<li>Support- und Sicherheitsfunktionen umzusetzen</li>
					<li>Missbrauch zu verhindern</li>
				</ul>
				<p>Rechtsgrundlage:</p>
				<p>Art. 6 Abs. 1 lit. b DSGVO<br />Art. 6 Abs. 1 lit. f DSGVO, soweit die Verarbeitung der IT-Sicherheit und Missbrauchsprävention dient</p>
			</section>

			<section>
				<h2>5. Nutzung von Google Firebase</h2>
				<p>Für zentrale Funktionen unserer Web-App verwenden wir Google Firebase. Dabei können personenbezogene Daten über Dienste von Google verarbeitet werden.</p>
				<p>Wir verwenden insbesondere:</p>
				<ul>
					<li>Firebase Authentication</li>
					<li>Cloud Firestore</li>
					<li>Firebase Cloud Messaging</li>
					<li>Firebase Analytics beziehungsweise Google Analytics for Firebase</li>
				</ul>

				<h3>5.1 Firebase Authentication</h3>
				<p>Zur Anmeldung und Verwaltung von Nutzerkonten nutzen wir Firebase Authentication.</p>
				<p>Dabei werden insbesondere verarbeitet:</p>
				<ul>
					<li>E-Mail-Adresse</li>
					<li>Authentifizierungsdaten</li>
					<li>interne Nutzerkennungen</li>
					<li>Zeitpunkte von Registrierungen und Anmeldungen</li>
					<li>sicherheitsrelevante technische Informationen</li>
				</ul>
				<p>Die Verarbeitung erfolgt zur Bereitstellung eines sicheren Login- und Kontosystems.</p>
				<p>Rechtsgrundlage:</p>
				<p>Art. 6 Abs. 1 lit. b DSGVO<br />Art. 6 Abs. 1 lit. f DSGVO</p>

				<h3>5.2 Cloud Firestore</h3>
				<p>Zur Speicherung nutzerbezogener Daten und App-Daten nutzen wir Cloud Firestore.</p>
				<p>Dabei können insbesondere folgende Daten verarbeitet werden:</p>
				<ul>
					<li>Vorname</li>
					<li>Nachname</li>
					<li>optionaler Firmenname</li>
					<li>E-Mail-Adresse</li>
					<li>Profilbild, sofern hochgeladen</li>
					<li>Kontoeinstellungen</li>
					<li>Nutzungs- und Anwendungsdaten</li>
					<li>abrechnungsbezogene Daten, soweit für die Vertragsdurchführung erforderlich</li>
				</ul>
				<p>Die Verarbeitung erfolgt zur Erfüllung unserer vertraglichen Leistungen und zur Bereitstellung der Web-App.</p>
				<p>Rechtsgrundlage:</p>
				<p>Art. 6 Abs. 1 lit. b DSGVO</p>

				<h3>5.3 Firebase Cloud Messaging</h3>
				<p>Wenn Sie Push-Benachrichtigungen aktivieren, nutzen wir Firebase Cloud Messaging, um Ihnen technische oder nutzungsbezogene Benachrichtigungen zu senden.</p>
				<p>Dabei können insbesondere verarbeitet werden:</p>
				<ul>
					<li>Push-Token beziehungsweise Messaging-Token</li>
					<li>technische Geräte- oder Browserinformationen</li>
					<li>Benachrichtigungseinstellungen</li>
					<li>Zeitpunkte von Zustellungen oder Interaktionen mit Benachrichtigungen</li>
				</ul>
				<p>Push-Benachrichtigungen versenden wir nur, wenn Sie diese Funktion aktivieren beziehungsweise die erforderliche Browserberechtigung erteilen.</p>
				<p>Rechtsgrundlage:</p>
				<p>Art. 6 Abs. 1 lit. a DSGVO</p>
				<p>Sie können Ihre Einwilligung jederzeit für die Zukunft widerrufen, indem Sie Push-Benachrichtigungen in Ihren Browser- oder Geräteeinstellungen deaktivieren und sofern vorhanden auch in Ihrem Nutzerkonto anpassen.</p>

				<h3>5.4 Firebase Analytics beziehungsweise Google Analytics for Firebase</h3>
				<p>Soweit Sie im Consent-Tool eingewilligt haben, nutzen wir Firebase Analytics, um das Nutzungsverhalten innerhalb unserer Website und Web-App statistisch auszuwerten und unser Angebot zu verbessern.</p>
				<p>Dabei können insbesondere verarbeitet werden:</p>
				<ul>
					<li>Nutzungsereignisse</li>
					<li>Interaktionen mit Funktionen</li>
					<li>technische Informationen zu Browser, Gerät und App-Nutzung</li>
					<li>pseudonyme Kennungen</li>
					<li>Informationen über Zugriffe und Nutzungsmuster</li>
				</ul>
				<p>Rechtsgrundlage:</p>
				<p>Art. 6 Abs. 1 lit. a DSGVO</p>
				<p>Soweit hierfür Informationen auf Ihrem Endgerät gespeichert oder ausgelesen werden, erfolgt dies zusätzlich auf Grundlage von § 25 Abs. 1 TDDDG.</p>
				<p>Sie können Ihre Einwilligung jederzeit über den Link Datenschutzeinstellungen mit Wirkung für die Zukunft widerrufen.</p>
			</section>

			<section>
				<h2>6. Zahlungen und Abonnements über Stripe</h2>
				<p>Für die Zahlungsabwicklung und das Management von Abonnements nutzen wir Stripe.</p>
				<p>Wenn Sie kostenpflichtige Leistungen buchen, werden die für die Zahlungsabwicklung erforderlichen Daten verarbeitet. Dazu können je nach Zahlungsmethode insbesondere gehören:</p>
				<ul>
					<li>Name</li>
					<li>E-Mail-Adresse</li>
					<li>Rechnungs- und Zahlungsdaten</li>
					<li>Transaktionsbetrag</li>
					<li>Währung</li>
					<li>Rechnungs- und Transaktionskennungen</li>
					<li>Abonnementstatus</li>
					<li>gegebenenfalls Rechnungsadresse oder weitere zahlungsbezogene Angaben</li>
				</ul>
				<p>Die eigentliche Verarbeitung sensibler Zahlungsdaten erfolgt in der Regel durch Stripe. Wir verarbeiten die abrechnungs- und vertragsbezogenen Informationen, die wir für Vertragsdurchführung, Buchhaltung, Support und Missbrauchsprävention benötigen.</p>
				<p>Rechtsgrundlage:</p>
				<p>Art. 6 Abs. 1 lit. b DSGVO<br />Art. 6 Abs. 1 lit. c DSGVO<br />Art. 6 Abs. 1 lit. f DSGVO</p>
			</section>

			<section>
				<h2>7. Cookies und ähnliche Technologien</h2>
				<p>Wir verwenden auf unserer Website technisch notwendige Cookies und vergleichbare Technologien, insbesondere für:</p>
				<ul>
					<li>Login- und Sitzungsverwaltung</li>
					<li>Sicherheitsfunktionen</li>
					<li>Speicherung von Einstellungen</li>
					<li>technisch notwendige Abläufe der Web-App</li>
				</ul>
				<p>Analyse-Technologien setzen wir nur ein, wenn Sie zuvor eingewilligt haben.</p>
				<p>Weitere Informationen zu eingesetzten Kategorien und Ihren Auswahlmöglichkeiten finden Sie in unserem Consent-Tool unter Datenschutzeinstellungen.</p>
			</section>

			<section>
				<h2>8. Zwecke der Datenverarbeitung</h2>
				<p>Wir verarbeiten personenbezogene Daten insbesondere zu folgenden Zwecken:</p>
				<ul>
					<li>Bereitstellung der Website und Web-App</li>
					<li>Durchführung von Registrierungen und Logins</li>
					<li>Verwaltung von Nutzerkonten</li>
					<li>Bereitstellung vertraglicher Leistungen</li>
					<li>Zahlungsabwicklung und Abonnementverwaltung</li>
					<li>technische Sicherheit und Missbrauchsprävention</li>
					<li>Kommunikation mit Nutzern</li>
					<li>Versand von Push-Benachrichtigungen, soweit aktiviert</li>
					<li>Analyse und Optimierung unseres Angebots, soweit eingewilligt</li>
				</ul>
			</section>

			<section>
				<h2>9. Empfänger und Kategorien von Empfängern</h2>
				<p>Personenbezogene Daten können an folgende Kategorien von Empfängern übermittelt werden:</p>
				<ul>
					<li>Hosting- und Infrastruktur-Dienstleister</li>
					<li>Cloud- und Datenbank-Dienstleister</li>
					<li>Zahlungsdienstleister</li>
					<li>IT- und Support-Dienstleister</li>
					<li>Behörden oder sonstige Stellen, soweit wir hierzu gesetzlich verpflichtet sind</li>
				</ul>
			</section>

			<section>
				<h2>10. Drittlandübermittlungen</h2>
				<p>Im Rahmen der Nutzung von Vercel, Google Firebase und Stripe kann nicht ausgeschlossen werden, dass personenbezogene Daten auch in Staaten außerhalb der Europäischen Union beziehungsweise des Europäischen Wirtschaftsraums verarbeitet werden.</p>
				<p>Sofern dabei kein Angemessenheitsbeschluss besteht, achten wir auf geeignete Garantien im Sinne der Art. 44 ff. DSGVO, insbesondere auf Standardvertragsklauseln oder andere zulässige Transfermechanismen.</p>
			</section>

			<section>
				<h2>11. Speicherdauer</h2>
				<p>Wir speichern personenbezogene Daten nur so lange, wie dies für die jeweiligen Zwecke erforderlich ist.</p>
				<p>Im Einzelnen gilt:</p>
				<ul>
					<li>Kontodaten speichern wir grundsätzlich bis zur Löschung des Nutzerkontos oder bis zur Beendigung des Vertragsverhältnisses.</li>
					<li>Vertrags- und Abrechnungsdaten speichern wir darüber hinaus, soweit gesetzliche handels- oder steuerrechtliche Aufbewahrungspflichten bestehen.</li>
					<li>Einwilligungsdaten speichern wir, soweit erforderlich, für Nachweis- und Dokumentationszwecke.</li>
					<li>Push-Token speichern wir bis zum Widerruf, zur Deaktivierung der Funktion oder bis zur Löschung des Kontos.</li>
					<li>Analysebezogene Daten speichern wir nach Maßgabe Ihrer Einwilligung und der jeweils eingerichteten Tool- beziehungsweise Systemeinstellungen.</li>
				</ul>
			</section>

			<section>
				<h2>12. Ihre Rechte</h2>
				<p>Sie haben nach der DSGVO insbesondere folgende Rechte:</p>
				<ul>
					<li>Recht auf Auskunft</li>
					<li>Recht auf Berichtigung</li>
					<li>Recht auf Löschung</li>
					<li>Recht auf Einschränkung der Verarbeitung</li>
					<li>Recht auf Datenübertragbarkeit</li>
					<li>Recht auf Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO</li>
					<li>Recht auf Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft</li>
					<li>Recht auf Beschwerde bei einer Datenschutzaufsichtsbehörde</li>
				</ul>
				<p>
					Zur Ausübung Ihrer Rechte genügt eine Nachricht an:<br />
					<a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>
				</p>
			</section>

			<section>
				<h2>13. Beschwerderecht bei der Aufsichtsbehörde</h2>
				<p>Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren.</p>
			</section>

			<section>
				<h2>14. Keine Pflicht zur Bereitstellung bestimmter Daten</h2>
				<p>Soweit personenbezogene Daten für die Registrierung, Vertragserfüllung oder Zahlungsabwicklung erforderlich sind, ist die Bereitstellung dieser Daten notwendig. Ohne diese Daten können wir bestimmte Leistungen nicht erbringen.</p>
			</section>

			<section>
				<h2>15. Automatisierte Entscheidungen</h2>
				<p>Eine ausschließlich automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO findet nicht statt.</p>
			</section>

			<section>
				<h2>16. Änderung dieser Datenschutzerklärung</h2>
				<p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn dies aufgrund rechtlicher, technischer oder organisatorischer Änderungen erforderlich wird.</p>
			</section>
		</LegalPageShell>
	);
}