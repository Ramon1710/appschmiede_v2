// src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import {
  createProject,
  listProjectsForUser,
  removeProject,
} from "../../lib/db-projects";
import type { ProjectInfo } from "../../lib/editorTypes";
import { Loader2, Plus, LogOut, RefreshCw, Trash2, ExternalLink } from "lucide-react";

export default function DashboardPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectInfo[] | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/login";
        return;
      }
      setUid(u.uid);
      await reload(u.uid);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = async (theUid?: string) => {
    try {
      setError(null);
      setProjects(null);
      const id = theUid ?? uid;
      if (!id) return;
      const list = await listProjectsForUser(id);
      setProjects(list);
    } catch (e: any) {
      setProjects([]);
      setError(e?.message || "Fehler beim Laden deiner Projekte.");
    }
  };

  const onCreate = async () => {
    if (!uid || !newName.trim()) return;
    setBusy(true);
    try {
      const id = await createProject(newName.trim(), uid);
      setNewName("");
      await reload(uid);
      window.location.href = `/projects/${id}`;
    } catch (e: any) {
      setError(e?.message || "Projekt konnte nicht angelegt werden.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Projekt wirklich löschen?")) return;
    setBusy(true);
    try {
      await removeProject(id);
      await reload(uid!);
    } catch (e: any) {
      setError(e?.message || "Löschen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={() => signOut(auth)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#1d1f22] hover:bg-[#26292d] text-sm"
        >
          <LogOut size={16} />
          Abmelden
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-[#222] bg-[#111218]">
        <div className="p-4 border-b border-[#222] font-medium">Neues Projekt</div>
        <div className="p-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Projektname"
            className="flex-1 bg-[#0f1113] border border-[#2a2d31] rounded px-3 py-2 outline-none"
          />
          <button
            onClick={onCreate}
            disabled={busy || !newName.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
          >
            <Plus size={16} />
            Anlegen
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[#222] bg-[#111218]">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <div className="font-medium">Meine Projekte</div>
          <button
            onClick={() => reload()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#1d1f22] hover:bg-[#26292d] text-sm"
          >
            <RefreshCw size={16} />
            Aktualisieren
          </button>
        </div>

        {projects === null && (
          <div className="p-4 text-gray-300 flex items-center gap-2">
            <Loader2 className="animate-spin" /> lädt …
          </div>
        )}

        {error && projects !== null && (
          <div className="p-4 text-red-300 text-sm">{error}</div>
        )}

        {projects && (
          <div className="p-2">
            {!projects.length && (
              <div className="text-sm text-gray-400 px-2 py-4">
                Keine Projekte gefunden. Lege oben ein neues an.
              </div>
            )}
            <ul className="space-y-2">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#0f1113] border border-[#2a2d31]"
                >
                  <div className="flex-1">
                    <div className="font-medium">{p.name ?? "Ohne Namen"}</div>
                    <div className="text-xs text-gray-400">ID: {p.id}</div>
                  </div>

                  <Link
                    href={`/projects/${p.id}`}
                    className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded bg-[#1d1f22] hover:bg-[#26292d]"
                  >
                    <ExternalLink size={14} />
                    Öffnen
                  </Link>

                  <button
                    onClick={() => onDelete(p.id)}
                    className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded bg-[#2a0f12] hover:bg-[#381317]"
                    title="Löschen"
                  >
                    <Trash2 size={14} />
                    Löschen
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
