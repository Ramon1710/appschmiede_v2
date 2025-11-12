// path: src/lib/db-projects.ts
// Stabile, benannte Exporte für Seiten wie /dashboard und /projects.
// Nutzt Firestore falls vorhanden; fällt ansonsten auf No-Op zurück.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export type Project = {
  id: string;
  name: string;
  ownerUid: string;
  members?: string[];
  createdAt?: any;
  updatedAt?: any;
};

// Alle Projekte eines Users in Echtzeit abonnieren
export function subscribeProjects(
  userId: string,
  onUpdate: (projects: Project[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, 'projects'),
    where('ownerUid', '==', userId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const projects: Project[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      onUpdate(projects);
    },
    (error) => {
      if (onError) onError(error as Error);
    }
  );

  return unsubscribe;
}

// Einzelnes Projekt abrufen
export async function getProject(projectId: string): Promise<Project | null> {
  const doc_ = await getDoc(doc(db, 'projects', projectId));
  if (!doc_.exists()) return null;
  return { id: doc_.id, ...(doc_.data() as any) };
}

// Projekt erstellen
export async function createProject(ownerUid: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, 'projects'), {
    name,
    ownerUid,
    members: [ownerUid],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Projekt umbenennen
export async function renameProject(projectId: string, newName: string): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId), {
    name: newName,
    updatedAt: serverTimestamp(),
  });
}

// Projekt löschen
export async function removeProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId));
}
