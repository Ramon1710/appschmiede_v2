"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

type Project = {
  id: string;
  name: string;
  ownerId: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);

  const userProjectsQuery = useMemo(() => {
    if (!uid) return null;
    return query(
      collection(db, "projects"),
      where("ownerId", "==", uid),
      orderBy("createdAt", "desc")
    );
  }, [uid]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setUid(user.uid);
        setDisplayName(user.displayName);
        setEmail(user.email);
        setReady(true);
      }
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!userProjectsQuery) return;
    const unsub = onSnapshot(userProjectsQuery, (snap) => {
      const rows: Project[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setProjects(rows);
    });
    return () => unsub();
  }, [userProjectsQuery]);

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !newName.trim()) return;
    setLoadingCreate(true);
    try {
      await addDoc(collection(db, "projects"), {
        name: newName.trim(),
        ownerId: uid,
        createdAt: serverTimestamp(),
      });
      setNewName("");
    } finally {
      setLoadingCreate(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Projekt wirklich löschen?")) return;
    await deleteDoc(doc(db, "projects", id));
  };

  const openProject = (id: string) => {
    router.push(`/projects/${id}`);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        Lade…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      <div className="mx-auto max-w-3xl px-6 pt-14">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={logout}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Abmelden
          </button>
        </div>

        <p className="text-slate-300">Willkommen {displayName ?? email} 👋</p>

        {/* Neues Projekt */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="mb-4 text-lg font-semibold">Neues Projekt</h2>
          <form onSubmit={createProject} className="flex gap-2">
            <input
              type="text"
              placeholder="Projektname"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
              required
              maxLength={80}
            />
            <button
              type="submit"
              disabled={loadingCreate}
              className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-60"
            >
              {loadingCreate ? "Anlegen…" : "Anlegen"}
            </button>
          </form>
        </div>

        {/* Projektliste */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="mb-4 text-lg font-semibold">Meine Projekte</h2>

          {projects.length === 0 ? (
            <p className="text-slate-400">Noch keine Projekte.</p>
          ) : (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-slate-400">ID: {p.id}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                      onClick={() => openProject(p.id)}
                    >
                      Öffnen
                    </button>
                    <button
                      className="rounded-lg border border-red-700/70 px-3 py-2 text-sm text-red-300 hover:bg-red-950/50"
                      onClick={() => deleteProject(p.id)}
                    >
                      Löschen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-slate-300">
            Hier kommt später der App-Editor, Chat, Zeiterfassung usw.
          </p>
        </div>
      </div>
    </div>
  );
}
