"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  createPage,
  listPagesByProject,
  renamePage,
  deletePage,
  getProject,
} from "../../../lib/db-editor";
import type { PageDoc } from "../../../lib/editorTypes";
import { Loader2, Pencil, Trash2, Plus, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string };
  const [pages, setPages] = useState<PageDoc[] | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Timeout-Schutz gegen Endlos-Loader (z.B. bei Netzwerkhang)
  useEffect(() => {
    const t = setTimeout(() => {
      if (pages === null && !error) {
        setError("Zeitüberschreitung beim Laden. Bitte erneut versuchen.");
        setPages([]); // Loader beenden
      }
    }, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, pages, error]);

  const activePageId = useMemo(() => {
    if (!pages || !pages.length) return null;
    const home = pages.find((p) => p.isHome);
    return (home ?? pages[0]).id;
  }, [pages]);

  const load = async () => {
    try {
      setError(null);
      setPages(null);

      // 1) Prüfe erst, ob Projekt existiert / lesbar ist
      const proj = await getProject(projectId);
      if (!proj) {
        setError("Projekt nicht gefunden oder keine Leseberechtigung.");
        setPages([]);
        return;
      }
      setProjectName(proj.name ?? "Projekt");

      // 2) Seiten holen
      const list = await listPagesByProject(projectId);
      if (!list.length) {
        // Optional: automatisch Startseite anlegen – nur wenn erlaubt
        try {
          await createPage(projectId, "Startseite");
          const afterCreate = await listPagesByProject(projectId);
          setPages(afterCreate);
          return;
        } catch (e: any) {
          // Kein Schreibrecht → trotzdem UI zeigen
          setPages([]);
          setError("Keine Berechtigung zum Anlegen von Seiten. (Lesen ok)");
          return;
        }
      }
      setPages(list);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Fehler beim Laden der Seiten.");
      setPages([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const onNew = async () => {
    setBusy(true);
    try {
      await createPage(projectId, `Seite ${pages ? pages.length + 1 : 1}`);
      await load();
    } catch (e) {
      console.error(e);
      setError("Seite konnte nicht angelegt werden.");
    } finally {
      setBusy(false);
    }
  };

  const onRename = async (id: string) => {
    setBusy(true);
    try {
      await renamePage(id, editName || "Seite");
      setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
      setError("Umbenennen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Seite wirklich löschen?")) return;
    setBusy(true);
    try {
      await deletePage(id);
      await load();
    } catch (e) {
      console.error(e);
      setError("Löschen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="text-yellow-400" />
          <span className="font-semibold">Problem:</span>
          <span className="text-sm opacity-90">{error}</span>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 bg-[#1d1f22] hover:bg-[#26292d] px-3 py-2 rounded"
        >
          <RefreshCw size={16} />
          Erneut laden
        </button>
      </div>
    );
  }

  if (pages === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-gray-300">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" /> lädt Projekt …
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{projectName ?? "Projekt"}</h1>
        {activePageId && (
          <Link
            href={`/editor/${projectId}/${activePageId}`}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl"
          >
            <ExternalLink size={16} />
            Editor öffnen
          </Link>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-[#222] bg-[#111218]">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <div className="font-medium">Seiten</div>
          <button
            onClick={onNew}
            disabled={busy}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1d1f22] hover:bg-[#26292d] disabled:opacity-60"
          >
            <Plus size={16} />
            Neu
          </button>
        </div>

        <div className="p-2">
          {!pages.length && (
            <div className="text-sm text-gray-400 px-2 py-4">
              Noch keine Seiten (oder keine Berechtigung zum Anlegen).
            </div>
          )}

          <ul className="divide-y divide-[#222]">
            {pages.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 hover:bg-[#0e0f14]">
                <Link href={`/editor/${projectId}/${p.id}`} className="flex-1 truncate" title="Im Editor öffnen">
                  <span className="text-sm">{p.name}</span>
                </Link>

                <button
                  className="opacity-70 hover:opacity-100"
                  title="Umbenennen"
                  onClick={() => {
                    setEditingId(p.id);
                    setEditName(p.name);
                  }}
                >
                  <Pencil size={16} />
                </button>

                {editingId === p.id && (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => onRename(p.id)}
                    onKeyDown={(e) => e.key === "Enter" && onRename(p.id)}
                    className="bg-[#0f1113] border border-[#2a2d31] rounded px-2 py-1 text-sm w-64"
                  />
                )}

                <button className="opacity-70 hover:opacity-100" title="Löschen" onClick={() => onDelete(p.id)}>
                  <Trash2 size={16} />
                </button>

                <Link
                  href={`/editor/${projectId}/${p.id}`}
                  className="ml-2 text-xs px-2 py-1 rounded bg-[#1d1f22] hover:bg-[#26292d] whitespace-nowrap"
                >
                  Öffnen
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
