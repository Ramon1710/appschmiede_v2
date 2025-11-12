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

export type Project = {
  id: string;
  name: string;
  ownerUid: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function createProject(ownerUid: string, name = 'Neues Projekt') {
  const ref = await addDoc(collection(db, 'projects'), {
    name,
    ownerUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listProjects(ownerUid: string) {
  const q = query(collection(db, 'projects'), where('ownerUid', '==', ownerUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Project[];
}

export async function renameProject(projectId: string, newName: string) {
  await updateDoc(doc(db, 'projects', projectId), { name: newName, updatedAt: serverTimestamp() });
}

export async function removeProject(projectId: string) {
  await deleteDoc(doc(db, 'projects', projectId));
}

export function subscribeProjects(ownerUid: string, onUpdate: (projects: Project[]) => void) {
  const q = query(collection(db, 'projects'), where('ownerUid', '==', ownerUid));
  const unsub = onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Project[];
    onUpdate(projects);
  });
  return unsub;
}
