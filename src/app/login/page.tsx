"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginWithEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/projects");
    } catch (err: any) {
      setMsg(err?.message ?? "Login fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl mb-4">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E‑Mail"
          className="w-full p-2 rounded bg-neutral-800"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          type="password"
          className="w-full p-2 rounded bg-neutral-800"
        />
        {msg && <div className="text-sm text-rose-400">{msg}</div>}
        <div className="flex items-center justify-between">
          <button
            disabled={busy}
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded"
          >
            {busy ? "Anmelden…" : "Login"}
          </button>
          <Link href="/reset" className="text-sm text-neutral-400">
            Passwort vergessen?
          </Link>
        </div>
      </form>

      <div className="mt-4 text-sm">
        Noch kein Konto?{" "}
        <Link href="/register" className="text-emerald-400">
          Registrieren
        </Link>
      </div>
    </div>
  );
}
