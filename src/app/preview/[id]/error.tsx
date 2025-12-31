'use client';

import { useEffect } from 'react';

export default function PreviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Preview route error', error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center bg-neutral-950 px-6 text-center text-neutral-100">
      <div className="max-w-md space-y-3">
        <h1 className="text-lg font-semibold text-white">Fehler beim Laden der Vorschau</h1>
        <p className="text-sm text-neutral-400">
          Es ist ein Client-Fehler aufgetreten. Bitte lade die Seite neu oder öffne die Vorschau erneut aus dem Editor.
        </p>
        <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-3 text-left text-xs text-neutral-300">
          <div className="font-semibold text-neutral-100">Details</div>
          <div className="mt-2 break-words">{error?.message || 'Unbekannter Fehler'}</div>
          {error?.digest ? <div className="mt-2 opacity-70">Digest: {error.digest}</div> : null}
        </div>
        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            onClick={() => reset()}
          >
            Erneut versuchen
          </button>
          <a
            href="/projects"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Zu den Projekten
          </a>
        </div>
      </div>
    </main>
  );
}
