"use client";

import { useState } from 'react';

const impressumContent = (
  <div className="space-y-3 text-sm leading-6 text-neutral-100">
    <p className="font-semibold">Angaben gemäß § 5 TMG</p>
    <p>
      R. Meyer<br />
      Beethovenstraße 3<br />
      26810 Westoverledingen
    </p>
    <p>E-Mail: <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a></p>
    <p>Telefon: Auf Anfrage</p>
    <p>USt-IdNr.: wird aktuell nicht vergeben (Kleinunternehmer gemäß § 19 UStG)</p>
    <p className="font-semibold">Verantwortlich für den Inhalt</p>
    <p>R. Meyer – AppSchmiede</p>
    <p className="text-xs text-neutral-400">Stand: November 2025</p>
  </div>
);

const datenschutzContent = (
  <div className="space-y-4 text-sm leading-6 text-neutral-100">
    <section>
      <h2 className="text-lg font-semibold">1. Verantwortlicher</h2>
      <p>
        Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website ist R. Meyer, Beethovenstraße 3,
        26810 Westoverledingen, E-Mail: <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>.
      </p>
    </section>
    <section>
      <h2 className="text-lg font-semibold">2. Hosting & Infrastruktur</h2>
      <p>
        Die Website wird über Vercel bereitgestellt. Zusätzlich kommen Firebase Authentication, Firestore sowie Firebase Storage von
        Google Ireland Ltd. zum Einsatz. Es können Übermittlungen in Drittländer stattfinden. Google verfügt über EU-Standardvertragsklauseln.
      </p>
    </section>
    <section>
      <h2 className="text-lg font-semibold">3. Verarbeitete Daten</h2>
      <ul className="list-disc pl-5">
        <li>Server-Logfiles (IP-Adresse, Timestamp, User-Agent) zur Sicherstellung des Betriebs.</li>
        <li>Registrierungs- und Login-Daten (Name, E-Mail, Passwort-Hash) zur Kontoanlage in Firebase Auth.</li>
        <li>Profilerweiterungen wie Firmenname, Telefonnummer oder Projekte in Firestore.</li>
        <li>Nutzungsdaten im Editor (z. B. Projekt- und Seiteninhalte) zur Speicherung Ihrer Arbeit.</li>
      </ul>
    </section>
    <section>
      <h2 className="text-lg font-semibold">4. Zwecke & Rechtsgrundlagen</h2>
      <p>
        Die Verarbeitung erfolgt zur Bereitstellung der App-Schmiede (Art. 6 Abs. 1 lit. b DSGVO) sowie zur technischen Optimierung und
        Sicherheit (Art. 6 Abs. 1 lit. f DSGVO). Sofern eine Einwilligung erforderlich ist (z. B. Newsletter), erfolgt die Verarbeitung
        gemäß Art. 6 Abs. 1 lit. a DSGVO.
      </p>
    </section>
    <section>
      <h2 className="text-lg font-semibold">5. Speicherdauer</h2>
      <p>Personenbezogene Daten werden gelöscht, sobald der Zweck entfällt oder gesetzliche Aufbewahrungsfristen ablaufen.</p>
    </section>
    <section>
      <h2 className="text-lg font-semibold">6. Ihre Rechte</h2>
      <p>
        Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Datenübertragbarkeit und
        Widerspruch. Außerdem können Sie sich bei einer Datenschutzaufsichtsbehörde beschweren. Kontaktieren Sie uns dazu unter der oben
        genannten Adresse.
      </p>
    </section>
    <section>
      <h2 className="text-lg font-semibold">7. Kontakt</h2>
      <p>
        Anfragen richten Sie bitte an <a className="underline decoration-dotted" href="mailto:ramon.meyer@hotmail.de">ramon.meyer@hotmail.de</a>.
      </p>
    </section>
    <p className="text-xs text-neutral-400">Stand: November 2025</p>
  </div>
);

type Props = {
  className?: string;
  buttonLabel?: string;
};

export default function LegalModalTrigger({ className = '', buttonLabel = 'Impressum & Datenschutz' }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'impressum' | 'datenschutz'>('impressum');

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTab('impressum');
          setOpen(true);
        }}
        className={`rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/20 ${className}`}
      >
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#090c14] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {[
                  { id: 'impressum', label: 'Impressum' },
                  { id: 'datenschutz', label: 'Datenschutzerklärung' },
                ].map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setTab(entry.id as 'impressum' | 'datenschutz')}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      tab === entry.id ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 px-3 py-1 text-sm text-neutral-300 hover:bg-white/20"
                aria-label="Modal schließen"
              >
                Schließen
              </button>
            </div>
            <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
              {tab === 'impressum' ? impressumContent : datenschutzContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
