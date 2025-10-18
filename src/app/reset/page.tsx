"use client";

import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In Firebase-Schritt ersetzen wir das Alert durch sendPasswordResetEmail(...)
    alert(`(Demo) Passwort-Reset-Link wird an ${email} gesendet`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="mx-auto max-w-md px-6 pt-20">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Passwort zurücksetzen</h1>
          <p className="mt-2 text-slate-300">
            Gib deine E-Mail ein. Wir senden dir einen Link zum Zurücksetzen.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur"
        >
          <label className="mb-2 block text-sm text-slate-300">E-Mail</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
            required
          />

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-500 focus:outline-none"
          >
            Link senden
          </button>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
            <Link href="/login" className="hover:underline">
              Zurück zum Login
            </Link>
            <Link href="/register" className="hover:underline">
              Konto erstellen
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
