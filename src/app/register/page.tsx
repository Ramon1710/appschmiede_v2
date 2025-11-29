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
  const [paymentType, setPaymentType] = useState<'credit-card' | 'sepa'>('credit-card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [iban, setIban] = useState('');
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

    if (!cardHolder.trim()) {
      setError('Bitte gib den Karten- oder Kontoinhaber an.');
      return;
    }

    if (paymentType === 'credit-card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 12) {
        setError('Die Kartennummer scheint ungültig zu sein.');
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(cardExpiry)) {
        setError('Bitte gib das Ablaufdatum im Format MM/YY ein.');
        return;
      }
    } else {
      const normalizedIban = iban.replace(/\s+/g, '');
      if (normalizedIban.length < 12) {
        setError('Die IBAN scheint zu kurz zu sein.');
        return;
      }
    }

    setBusy(true);
    try {
      const displayName = `${firstName} ${lastName}`;
      const billingMethod = paymentType === 'credit-card'
        ? (() => {
            const digits = cardNumber.replace(/\D/g, '');
            const last4 = digits.slice(-4);
            return {
              type: 'credit-card' as const,
              label: `${cardHolder || 'Kreditkarte'} •••• ${last4}`,
              last4,
              expiresAt: cardExpiry,
            };
          })()
        : (() => {
            const normalizedIban = iban.replace(/\s+/g, '');
            const last4 = normalizedIban.slice(-4);
            return {
              type: 'sepa' as const,
              label: `${cardHolder || 'SEPA'} •••• ${last4}`,
              last4,
            };
          })();
      await registerWithEmail(email, password, displayName, company || undefined, billingMethod);
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

          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Zahlungsart</p>
                <p className="text-sm text-slate-200">Wir benötigen eine Zahlungsart für Coins & Abos.</p>
              </div>
              <div className="flex gap-2 text-xs font-semibold">
                {[
                  { id: 'credit-card', label: 'Kreditkarte' },
                  { id: 'sepa', label: 'SEPA' },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentType(method.id as 'credit-card' | 'sepa')}
                    className={`rounded-full border px-3 py-1 ${
                      paymentType === method.id
                        ? 'border-indigo-400 bg-indigo-500/20 text-white'
                        : 'border-slate-600 text-slate-300'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Inhaber *</label>
                <input
                  type="text"
                  placeholder="z. B. Alex Meyer"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
              {paymentType === 'credit-card' ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Kartennummer *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Ablauf (MM/YY) *</label>
                    <input
                      type="text"
                      placeholder="09/27"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm text-slate-300">IBAN *</label>
                  <input
                    type="text"
                    placeholder="DE44 5001 0517 5407 3249 31"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              )}
              <p className="text-xs text-slate-400">
                Deine Zahlungsdaten werden sicher gespeichert. Coins und Abos werden erst abgebucht, wenn du sie aktiv bestellst.
              </p>
            </div>
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