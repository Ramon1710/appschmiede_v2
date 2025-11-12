'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerWithEmail } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) {
      setMsg('Bitte E‑Mail und Passwort angeben.');
      return;
    }
    if (password.length < 6) {
      setMsg('Passwort mindestens 6 Zeichen.');
      return;
    }
    if (password !== confirm) {
      setMsg('Passwörter stimmen nicht überein.');
      return;
    }

    setBusy(true);
    try {
      await registerWithEmail(email, password, name || undefined);
      router.push('/projects');
    } catch (err: any) {
      setMsg(err?.message ?? 'Registrierung fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl mb-4">Registrieren</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" className="w-full p-2 rounded bg-neutral-800" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E‑Mail" className="w-full p-2 rounded bg-neutral-800" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" type="password" className="w-full p-2 rounded bg-neutral-800" />
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Passwort wiederholen" type="password" className="w-full p-2 rounded bg-neutral-800" />
        {msg && <div className="text-sm text-rose-400">{msg}</div>}
        <button disabled={busy} type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">
          {busy ? 'Registriere…' : 'Registrieren'}
        </button>
      </form>
    </div>
  );
}