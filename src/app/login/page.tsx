"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: In Schritt „Auth“ binden wir hier Firebase ein
    alert(`(Demo) Login geklickt für: ${email}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="mx-auto max-w-md px-6 pt-20">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">AppSchmiede</h1>
          <p className="mt-2 text-slate-300">Melde dich an, um weiterzuschmieden 🔧</p>
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

          <label className="mb-2 block text-sm text-slate-300">Passwort</label>
          <div className="mb-3 flex items-center gap-2">
            <input
              type={showPassword ? "text" : "password"}
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
              aria-label="Passwort anzeigen/ausblenden"
            >
              {showPassword ? "Verbergen" : "Anzeigen"}
            </button>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-500 focus:outline-none"
          >
            Anmelden
          </button>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
            <Link href="/register" className="hover:underline">
              Konto erstellen
            </Link>
            <Link href="/reset" className="hover:underline">
              Passwort vergessen?
            </Link>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Durch die Anmeldung akzeptierst du unsere{" "}
          <Link href="/legal/impressum" className="underline">
            rechtlichen Hinweise
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
