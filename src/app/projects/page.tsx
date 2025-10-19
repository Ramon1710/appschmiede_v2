'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Project = {
  id: string;
  name: string;
  ownerUid: string;
  createdAt?: any;
  updatedAt?: any;
};

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  const colRef = useMemo(() => {
    if (!user) return null;
    return collection(db, 'users', user.uid, 'projects');
  }, [user]);

  useEffect(() => {
    if (!colRef) return;
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items: Project[] = [];
      snap.forEach(d => items.push({ id: d.id, ...(d.data() as Omit<Project, 'id'>) }));
      setProjects(items);
      setListLoading(false);
    }, (err) => {
      setError(err.message ?? 'Fehler beim Laden');
      setListLoading(false);
    });
    return () => unsub();
  }, [colRef]);

  const createProject = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!colRef || !newName.trim()) return;
    try {
      const ref = await addDoc(colRef, {
        name: newName.trim(),
        ownerUid: user!.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewName('');
      router.push(`/projects/${ref.id}`);
    } catch (e:any) {
      setError(e.message ?? 'Projekt konnte nicht erstellt werden.');
    }
  };

  const renameProject = async (p: Project, name: string) => {
    if (!name.trim()) return;
    try {
      setBusyId(p.id);
      await updateDoc(doc(db, 'users', user!.uid, 'projects', p.id), {
        name: name.trim(),
        updatedAt: serverTimestamp(),
      });
    } catch (e:any) {
      setError(e.message ?? 'Umbenennen fehlgeschlagen.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteProjectById = async (p: Project) => {
    const ok = confirm(`Projekt „${p.name}“ wirklich löschen?`);
    if (!ok) return;
    try {
      setBusyId(p.id);
      await deleteDoc(doc(db, 'users', user!.uid, 'projects', p.id));
    } catch (e:any) {
      setError(e.message ?? 'Löschen fehlgeschlagen.');
    } finally {
      setBusyId(null);
    }
  };

  const openProject = (p: Project) => {
    router.push(`/projects/${p.id}`);
  };

  if (loading) return <div className="container"><div className="card">Wird geladen…</div></div>;
  if (!user) return null;

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Projekte</h2>
        <p style={{ color: 'var(--muted)' }}>
          Erstellen, umbenennen, löschen und öffnen. Sortiert nach letzter Aktivität.
        </p>

        <form onSubmit={createProject} className="row" style={{ marginTop: 10 }}>
          <input
            className="input"
            placeholder="Neues Projekt – Name eingeben"
            value={newName}
            onChange={(e)=>setNewName(e.target.value)}
            maxLength={80}
          />
          <button className="btn">Projekt erstellen</button>
        </form>

        {error && <div style={{ marginTop: 12 }} className="badge" title={error}>{error}</div>}

        <div className="hr" />

        {listLoading ? (
          <div className="badge">Lade Projekte…</div>
        ) : projects.length === 0 ? (
          <div className="badge">Noch keine Projekte. Lege das erste an!</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {projects.map(p => (
              <li key={p.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                alignItems: 'center',
                gap: 8,
                borderBottom: '1px solid var(--border)',
                padding: '10px 0'
              }}>
                <InlineRename
                  name={p.name}
                  disabled={busyId === p.id}
                  onSubmit={(name)=>renameProject(p, name)}
                />
                <button className="btn ghost" onClick={()=>openProject(p)} disabled={busyId === p.id}>
                  Öffnen
                </button>
                <Link className="btn ghost" href={`/projects/${p.id}`}>Editor</Link>
                <button className="btn danger" onClick={()=>deleteProjectById(p)} disabled={busyId === p.id}>
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InlineRename({
  name,
  disabled,
  onSubmit,
}: {
  name: string;
  disabled?: boolean;
  onSubmit: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  useEffect(()=>{ setValue(name); }, [name]);

  const commit = () => {
    if (value.trim() && value.trim() !== name) onSubmit(value.trim());
    setEditing(false);
  };

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <strong>{name}</strong>
        <button className="btn ghost" onClick={()=>setEditing(true)} disabled={disabled}>
          Umbenennen
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        className="input"
        style={{ maxWidth: 420 }}
        value={value}
        onChange={(e)=>setValue(e.target.value)}
        onKeyDown={(e)=>{ if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        disabled={disabled}
        autoFocus
      />
      <button className="btn" onClick={commit} disabled={disabled}>Speichern</button>
      <button className="btn ghost" onClick={()=>setEditing(false)} disabled={disabled}>Abbrechen</button>
    </div>
  );
}
