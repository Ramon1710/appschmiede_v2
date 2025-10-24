// src/lib/db-projects.ts
import { db } from './firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Project } from '@/types/editor';

const col = () => collection(db, 'projects');

export async function createProject(name: string, ownerId: string): Promise<Project> {
  const now = Date.now();
  const pageId = `pg_${Math.random().toString(36).slice(2)}`;
  const data: Project = {
    id: '', // wird nach addDoc gesetzt
    name: name || 'Neues Projekt',
    ownerId,
    pages: [{ id: pageId, name: 'Start', nodeIds: [] }],
    nodes: {},
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(col(), { ...data, _serverUpdatedAt: serverTimestamp() });
  const withId: Project = { ...data, id: ref.id };
  await updateDoc(doc(db, 'projects', ref.id), { id: ref.id, updatedAt: Date.now() });
  return withId;
}

export async function listProjects(ownerId: string): Promise<Project[]> {
  const q = query(col(), where('ownerId', '==', ownerId), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Project);
}

export function subscribeProjects(ownerId: string, cb: (p: Project[]) => void) {
  const q = query(col(), where('ownerId', '==', ownerId), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Project)));
}

export async function renameProject(id: string, name: string) {
  await updateDoc(doc(db, 'projects', id), { name, updatedAt: Date.now() });
}

export async function removeProject(id: string) {
  await deleteDoc(doc(db, 'projects', id));
}
