// src/lib/db-projects.ts  (nur createProject ersetzen)
import { db } from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Project } from '@/types/editor';

const col = () => collection(db, 'projects');

const uid = () => `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

export async function createProject(name: string, ownerId: string): Promise<Project> {
  const now = Date.now();
  const pageId = uid();
  const id = uid(); // clientseitige ID
  const data: Project = {
    id,
    name: name || 'Neues Projekt',
    ownerId,
    pages: [{ id: pageId, name: 'Start', nodeIds: [] }],
    nodes: {},
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'projects', id), { ...data, _serverUpdatedAt: serverTimestamp() });
  return data;
}

// (rest der Datei unverändert lassen)
