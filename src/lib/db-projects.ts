// path: src/lib/db-projects.ts
// Stabile, benannte Exporte für Seiten wie /dashboard und /projects.
// Nutzt Firestore falls vorhanden; fällt ansonsten auf No-Op zurück.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const PROJECT_ICON_CHOICES = ['📱', '🚀', '🎨', '🧱', '⚡', '💡', '🛠️', '🤖', '📊', '🧪'] as const;
export const DEFAULT_PROJECT_ICON = PROJECT_ICON_CHOICES[0];

export type Project = {
  id: string;
  name: string;
  ownerId: string;
  ownerUid?: string; // Kompatibilitätsfeld zu alten Rules
  members?: string[];
  createdAt?: any;
  updatedAt?: any;
  lastOpenedAt?: any;
  icon?: string;
  description?: string | null;
};

export async function createProject(name: string, ownerId: string) {
  const ref = await addDoc(collection(db, 'projects'), {
    name,
    ownerId,
    ownerUid: ownerId, // für evtl. alte Regeln
    members: [ownerId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastOpenedAt: serverTimestamp(),
    icon: DEFAULT_PROJECT_ICON,
  });
  return ref.id;
}

export async function listProjects(ownerId: string) {
  const q = query(collection(db, 'projects'), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Project[];
}

export async function renameProject(projectId: string, newName: string) {
  await updateDoc(doc(db, 'projects', projectId), { name: newName, updatedAt: serverTimestamp() });
}

export async function removeProject(projectId: string) {
  await deleteDoc(doc(db, 'projects', projectId));
}

export function subscribeProjects(ownerId: string, onUpdate: (projects: Project[]) => void) {
  const q = query(collection(db, 'projects'), where('ownerId', '==', ownerId));
  const unsub = onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Project[];
    onUpdate(projects);
  });
  return unsub;
}

export async function touchProject(projectId: string, type: 'opened' | 'edited' = 'edited') {
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };
  if (type === 'opened') {
    payload.lastOpenedAt = serverTimestamp();
  }
  try {
    await updateDoc(doc(db, 'projects', projectId), payload);
  } catch (error) {
    console.warn('touchProject failed', error);
  }
}

export async function updateProjectIcon(projectId: string, icon: string) {
  const normalized = icon && icon.trim() ? icon.trim().slice(0, 2) : DEFAULT_PROJECT_ICON;
  await updateDoc(doc(db, 'projects', projectId), {
    icon: normalized,
    updatedAt: serverTimestamp(),
  });
}
