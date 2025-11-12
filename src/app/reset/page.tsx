"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { sendResetEmail } from "@/lib/auth";
import { useI18n } from "@/components/I18nProviderClient";

export default function ResetPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!email) {
      setMsg("Bitte E‑Mail angeben.");
      return;
    }
    setBusy(true);
    try {
      await sendResetEmail(email);
      setMsg("Link zum Zurücksetzen wurde gesendet. Prüfe dein Postfach.");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setMsg(err?.message ?? "Fehler beim Versenden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container flex items-center justify-center" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div className="panel" style={{ width: '100%', maxWidth: 440 }}>
        <h1 className="text-2xl font-bold mb-6">{t('reset.title')}</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E‑Mail" type="email" />
          {msg && <div className="text-sm text-muted">{msg}</div>}
          <button disabled={busy} type="submit" className="btn btn-primary">
            {busy ? 'Sende…' : 'Link senden'}
          </button>
        </form>
      </div>
    </div>
  );
}
