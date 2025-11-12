"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { sendResetEmail } from "@/lib/auth";

export default function ResetPage() {
  const router = useRouter();
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
      // optional: weiterleiten nach X Sekunden
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setMsg(err?.message ?? "Fehler beim Versenden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl mb-4">Passwort zurücksetzen</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E‑Mail"
          className="w-full p-2 rounded bg-neutral-800"
        />
        {msg && <div className="text-sm text-neutral-400">{msg}</div>}
        <button
          disabled={busy}
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-white rounded"
        >
          {busy ? "Sende…" : "Link senden"}
        </button>
      </form>
    </div>
  );
}
