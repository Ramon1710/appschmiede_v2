"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithEmail } from "@/lib/auth";
import { useI18n } from "@/components/I18nProviderClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") ?? "/dashboard";
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      router.replace(redirectParam);
    } catch (err: any) {
      setMsg(err?.message ?? "Login fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container flex items-center justify-center" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div className="panel" style={{ width: '100%', maxWidth: 440 }}>
        <h1 className="text-2xl font-bold mb-6">{t('login.title')}</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E‑Mail" type="email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" type="password" />
          {msg && <div className="text-sm" style={{ color: '#ef4444' }}>{msg}</div>}
          <button disabled={busy} type="submit" className="btn btn-primary">
            {busy ? 'Anmelden…' : t('btn.login')}
          </button>
          <Link href="/reset" className="text-sm text-muted">Passwort vergessen?</Link>
        </form>

        <div className="text-sm text-muted mt-4">
          Noch kein Konto? <Link href="/register" className="text-accent">{t('btn.register')}</Link>
        </div>
      </div>
    </div>
  );
}
