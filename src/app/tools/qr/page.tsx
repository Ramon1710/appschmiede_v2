// src/app/tools/qr/page.tsx
'use client';
import { useMemo, useState } from 'react';

export default function QRTool() {
  const [id, setId] = useState('');
  const url = useMemo(
    () => (id ? `${typeof window !== 'undefined' ? window.location.origin : ''}/preview/${id}` : ''),
    [id]
  );

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <h1 className="text-xl font-semibold mb-4">QR-Code für Vorschau</h1>
        <label className="block text-sm mb-1">Projekt-ID</label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-full mb-3 rounded-xl bg-neutral-800 px-3 py-2 outline-none"
          placeholder="z. B. id_abcd1234_xyz"
        />
        {url && (
          <div className="mt-2 grid place-items-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`}
              alt="QR"
            />
            <div className="text-xs opacity-70 break-all mt-2">{url}</div>
          </div>
        )}
      </div>
    </main>
  );
}
