// src/app/editor/error.tsx
'use client';

import { useEffect } from 'react';

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[EditorError]', error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center">
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 max-w-xl">
        <div className="text-xl font-semibold mb-2">Fehler im Editor</div>
        <pre className="text-xs bg-black/30 p-3 rounded overflow-auto">{error.message}</pre>

        {(error.digest || error.stack) && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-neutral-200">Details</summary>
            <div className="mt-2 space-y-2">
              {error.digest && (
                <pre className="text-xs bg-black/30 p-3 rounded overflow-auto">Digest: {error.digest}</pre>
              )}
              {error.stack && <pre className="text-xs bg-black/30 p-3 rounded overflow-auto">{error.stack}</pre>}
            </div>
          </details>
        )}
        <button onClick={() => reset()} className="mt-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">
          Neu laden
        </button>
      </div>
    </main>
  );
}
