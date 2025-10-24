// src/app/editor/error.tsx
'use client';

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen grid place-items-center">
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 max-w-xl">
        <div className="text-xl font-semibold mb-2">Fehler im Editor</div>
        <pre className="text-xs bg-black/30 p-3 rounded overflow-auto">{error.message}</pre>
        <button onClick={() => reset()} className="mt-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">
          Neu laden
        </button>
      </div>
    </main>
  );
}
