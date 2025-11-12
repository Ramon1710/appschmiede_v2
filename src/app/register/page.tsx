'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerWithEmail } from '@/lib/auth';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await registerWithEmail(email, password, name || undefined);
      router.push('/projects');
    } catch (err: any) {
      setError(err?.message ?? 'Fehler');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl mb-4">Registrieren</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" type="password" className="w-full" />
        {error && <div className="text-rose-500">{error}</div>}
        <button disabled={busy} type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">
          {busy ? 'Bitte warten…' : 'Registrieren'}
        </button>
      </form>
    </div>
  );
}