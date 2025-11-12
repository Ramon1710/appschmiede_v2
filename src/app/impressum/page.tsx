export default function ImpressumPage() {
  return (
    <div className="container" style={{ maxWidth: 800, paddingTop: 40 }}>
      <div className="panel">
        <h1 className="text-2xl font-bold mb-6">Impressum & Datenschutz</h1>
        <div className="text-sm text-muted space-y-4">
          <section>
            <h2 className="font-semibold text-lg mb-2">Impressum</h2>
            <p>Ramon Meyer<br/>Beispielstraße 1<br/>12345 Musterstadt<br/>Deutschland</p>
            <p className="mt-2">E-Mail: ramon.meyer@hotmail.de</p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">Datenschutz</h2>
            <p>Wir speichern nur die notwendigsten Daten (E-Mail, Passwort-Hash, Projekte). Deine Daten werden sicher in Firebase gespeichert und nicht an Dritte weitergegeben.</p>
          </section>
        </div>
      </div>
    </div>
  );
}