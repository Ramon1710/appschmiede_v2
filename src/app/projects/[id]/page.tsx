"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import Link from "next/link";

type ProjectDoc = {
  name: string;
  ownerId: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [uid, setUid] = useState<string | null>(null);
  const [readyAuth, setReadyAuth] = useState(false);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectDoc | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setUid(user.uid);
        setReadyAuth(true);
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!readyAuth || !uid || !projectId) return;
    const ref = doc(db, "projects", projectId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setErr("Projekt nicht gefunden oder keine Berechtigung.");
          setLoading(false);
          return;
        }
        const data = snap.data() as ProjectDoc;
        if (data.ownerId !== uid) {
          setErr("Keine Berechtigung für dieses Projekt.");
          setLoading(false);
          return;
        }
        setProject(data);
        setEditName(data.name);
        setLoading(false);
      },
      (error) => {
        setErr(error.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [readyAuth, uid, projectId]);

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !editName.trim()) return;
    setSaving(true);
    try {
      const ref = doc(db, "projects", projectId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Projekt nicht gefunden");
      const data = snap.data() as ProjectDoc;
      if (data.ownerId !== uid) throw new Error("Keine Berechtigung");
      await updateDoc(ref, { name: editName.trim() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!readyAuth || loading) {
    return <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">Lade…</div>;
  }

  if (err) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className="mx-auto max-w-3xl px-6 pt-14">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">← Zurück</Link>
            <button onClick={logout} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Abmelden</button>
          </div>
          <p className="rounded-lg border border-red-800 bg-red-900/30 p-4 text-red-200">{err}</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="mx-auto max-w-5xl px-6 pt-14">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">← Zurück</Link>
            <h1 className="text-2xl font-bold">Projekt: {project.name}</h1>
          </div>
          <button onClick={logout} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Abmelden</button>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px,1fr,280px]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="mb-3 font-semibold">Komponenten</h2>
            <p className="text-sm text-slate-400">Demnächst: Button, Text, Bild, Eingabe…</p>
          </aside>

          <main className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 min-h-[500px] flex items-center justify-center">
            <p className="text-slate-400">Editor-Canvas (Drag & Drop) – folgt ✨</p>
          </main>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="mb-3 font-semibold">Projekteinstellungen</h2>
            <form onSubmit={saveName} className="space-y-3">
              <label className="block text-sm text-slate-300">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
                maxLength={80}
                required
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? "Speichere…" : "Speichern"}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
