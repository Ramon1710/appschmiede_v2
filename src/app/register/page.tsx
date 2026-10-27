import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#03050a] px-4 py-12 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b12] p-8 text-center shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-200">Headbang Handwerk e. V.</p>
        <h1 className="mt-3 text-3xl font-semibold">Registrierung nur mit Einladung</h1>
        <p className="mt-4 text-sm leading-6 text-neutral-300">
          Neue AppSchmiede-Konten können ausschließlich über einen persönlichen Einladungslink erstellt werden. Öffne den Link aus deiner Einladung, um fortzufahren.
        </p>
        <Link href="/login" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-200">
          Zum Login
        </Link>
      </section>
    </main>
  );
}
