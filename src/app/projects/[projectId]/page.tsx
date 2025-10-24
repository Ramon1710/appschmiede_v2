// src/app/projects/[projectId]/page.tsx
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
import { ensureMaster } from "../../../lib/db-projects";
import type { PageDoc, ProjectInfo } from "../../../lib/editorTypes";
import { auth } from "../../../lib/firebase";
import {
  Loader2,
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  KeyRound,
} from "lucide-react";

function withTimeout<T>(p: Promise<T>, ms = 8000, tag = "request"): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout:${tag}:${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); })
     .catch((e) => { clearTimeout(t); reject(e); });
  });
}

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string };
  const [pages, setPages] = useState<PageDoc[] | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("init");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const log = (msg: string) =>
    setDebug((d) => `${d}\n${new Date().toISOString()} ${msg}`);

  const activePageId = useMemo(() => {
    if (!pages || !pages.length) return null;
    const home = pages.find((p) => p.isHome);
    return (home ?? pages[0]).id;
  }, [pages]);

  const load = async () => {
    try {
      setError(null);
      setPages(null);
      setDebug(`init ${projectId}`);

      // 1) Projekt lesen
      log("getProject:start");
      const proj: ProjectInfo | null = await withTimeout(getProject(projectId), 8000, "getProject");
      log("getProject:done");
      if (!proj) {
        setError("Projekt nicht gefunden oder keine Leseberechtigung.");
        setPages([]);
        return;
      }
      setProjectName(proj.name ?? "Projekt");

      // 2) Seiten laden
      log("listPages:start");
      const list: PageDoc[] = await withTimeout(listPagesByProject(projectId), 8000, "listPages");
      log(`listPages:done count=${list.length}`);

      if (!list.length) {
        // 3) Startseite anlegen (optional)
        try {
          log("createPage:start");
          await withTimeout(createPage(projectId, "Startseite"), 8000, "createPage");
          log("createPage:done");
          const after: PageDoc[] = await withTimeout(listPagesByProject(projectId), 8000, "listPages.afterCreate");
          setPages(after);
          return;
        } catch (e: any) {
          log(`createPage:error ${e?.code || ""} ${e?.message || e}`);
          setError("Keine Berechtigung zum Anlegen von Seiten. (Lesen ok)");
          setPages([]);
          return;
        }
      }

      setPages(list);
    } catch (e: any) {
      const msg = e?.message || String(e);
      log(`load:error ${e?.code || ""} ${msg}`);
      setError(msg);
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
    } catch (e: any) {
      setError(e?.message || "Seite konnte nicht angelegt werden.");
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
    } catch (e: any) {
      setError(e?.message || "Umbenennen fehlgeschlagen.");
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
    } catch (e: any) {
      setError(e?.message || "Löschen fehlgeschlagen.");
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
          <span className="text-sm opacity-90 break-all">{error}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 bg-[#1d1f22] hover:bg-[#26292d] px-3 py-2 rounded"
          >
            <RefreshCw size={16} />
            Erneut laden
          </button>

          <button
            onClick={async () => {
              const u = auth.currentUser;
              if (!u) { alert("Nicht eingeloggt."); return; }
              try {
                await ensureMaster(projectId, u.uid);
                await load();
              } catch (e: any) {
                alert(e?.message || "Zugriff reparieren fehlgeschlagen.");
              }
            }}
            className="inline-flex items-center gap-2 bg-[#0f3b1f] hover:bg-[#125a32] px-3 py-2 rounded"
            title="Trägt dich als 'master' in dieses Projekt ein (erfordert Owner-Recht)."
          >
            <KeyRound size={16} />
            Zugriff reparieren
          </button>
        </div>

        <pre className="mt-4 text-[11px] leading-5 bg-black/40 rounded p-3 overflow-auto max-h-64">
          {debug}
        </pre>
      </div>
    );
  }

  if (pages === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-gray-300">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" /> lädt Projekt …
        </div>
        <pre className="mt-4 text-[11px] leading-5 bg-black/30 rounded p-3 overflow-auto max-h-64">
          {debug}
        </pre>
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
