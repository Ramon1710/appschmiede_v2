"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/dashboard");
    });
    return () => unsub();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Registrierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="mx-auto max-w-md px-6 pt-20">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">AppSchmiede</h1>
          <p className="mt-2 text-slate-300">Erstelle dein Konto und starte dein erstes Projekt 🚀</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur">
          {err && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

          <label className="mb-2 block text-sm text-slate-300">Name</label>
          <input
            type="text"
            placeholder="Max Mustermann"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
            required
          />

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
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">
              {showPassword ? "Verbergen" : "Anzeigen"}
            </button>
          </div>

          <button disabled={loading} type="submit" className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-60">
            {loading ? "Erstellen…" : "Konto erstellen
