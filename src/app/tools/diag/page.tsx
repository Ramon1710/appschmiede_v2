// src/app/tools/diag/page.tsx
export default function Diag() {
  return (
    <main className="min-h-screen grid place-items-center">
      <div className="space-y-4">
        <div className="text-xl font-semibold">Tailwind Check</div>
        <div className="p-4 rounded-xl bg-emerald-600 text-white">
          Wenn dieser Block grün ist, läuft Tailwind ✅
        </div>
        <div className="p-4 rounded-xl bg-white/10">Halbtransparent = Utilities aktiv</div>
      </div>
    </main>
  );
}
