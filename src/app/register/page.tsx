'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithEmail } from '@/lib/auth';
import { useI18n } from '@/components/I18nProviderClient';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
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
      router.push('/dashboard');
    } catch (err: any) {
      setMsg(err?.message ?? 'Registrierung fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container flex items-center justify-center" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div className="panel" style={{ width: '100%', maxWidth: 440 }}>
        <h1 className="text-2xl font-bold mb-6">{t('register.title')}</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E‑Mail" type="email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" type="password" />
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Passwort wiederholen" type="password" />
          {msg && <div className="text-sm" style={{ color: '#ef4444' }}>{msg}</div>}
          <button disabled={busy} type="submit" className="btn btn-primary">
            {busy ? 'Registriere…' : t('btn.register')}
          </button>
        </form>
        <div className="text-sm text-muted mt-4">
          Schon ein Konto? <Link href="/login" className="text-accent">Login</Link>
        </div>
      </div>
    </div>
  );
}