'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithEmail } from '@/lib/auth';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Einfache Captcha-Frage (Random bei jedem Laden)
  const [captchaQuestion] = useState(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { question: `${a} + ${b}`, answer: a + b };
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validierung
    if (!firstName.trim() || !lastName.trim()) {
      setError('Vor- und Nachname sind erforderlich.');
      return;
    }
    if (!email.includes('@')) {
      setError('Bitte gültige E-Mail-Adresse eingeben.');
      return;
    }
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }
    if (parseInt(captcha) !== captchaQuestion.answer) {
      setError('Captcha-Antwort ist falsch. Bitte versuchen Sie es erneut.');
      return;
    }

    setBusy(true);
    try {
      const displayName = `${firstName} ${lastName}`;
      await registerWithEmail(email, password, displayName, company || undefined, null);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Registrierung fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="mx-auto max-w-md px-6 pt-20">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">AppSchmiede</h1>
          <p className="mt-2 text-slate-300">Erstelle dein Konto und starte durch 🚀</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur space-y-4">
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Vorname *</label>
              <input
                type="text"
                placeholder="Max"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Nachname *</label>
              <input
                type="text"
                placeholder="Mustermann"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Unternehmen (optional)</label>
            <input
              type="text"
              placeholder="Deine Firma GmbH"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/40 p-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Zahlungsart (optional)</p>
            <p className="text-sm text-slate-200">
              Du kannst die Zahlungsart später in deinem Profil hinterlegen – sie wird erst benötigt, wenn du Coins kaufst oder ein Abo startest.
            </p>
            <p className="text-xs text-slate-400">
              Hinweis: Speichere nach der Registrierung deine Zahlungsdaten im Profil, sobald du einen Kauf auslösen möchtest.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">E-Mail *</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Passwort *</label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Passwort bestätigen *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Bist du ein Mensch? 🤖</label>
            <p className="text-xs text-slate-400 mb-2">Bitte löse: {captchaQuestion.question} = ?</p>
            <input
              type="number"
              placeholder="Antwort"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            disabled={busy}
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? 'Registrierung läuft…' : 'Jetzt registrieren'}
          </button>

          <div className="text-center text-sm text-slate-300">
            Bereits registriert?{' '}
            <Link href="/login" className="text-indigo-400 hover:underline">
              Zum Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}