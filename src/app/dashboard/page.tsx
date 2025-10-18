"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setDisplayName(user.displayName);
        setEmail(user.email);
        setReady(true);
      }
    });
    return () => unsub();
  }, [router]);

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">Lade…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="mx-auto max-w-3xl px-6 pt-14">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button onClick={logout} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Abmelden</button>
        </div>
        <p className="text-slate-300">Willkommen {displayName ?? email} 👋</p>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-slate-300">
            Hier kommt später der App-Editor, Projekte, Chat, Zeiterfassung usw.
          </p>
        </div>
      </div>
    </div>
  );
}
