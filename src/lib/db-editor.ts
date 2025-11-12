// src/lib/db-editor.ts
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type PageTree = {
  id?: string;
  name: string;
  tree: any;
  folder?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

export async function savePage(projectId: string, pageId: string, payload: PageTree) {
  const ref = doc(db, 'projects', projectId, 'pages', pageId);
  const toSave: DocumentData = {
    ...payload,
    updatedAt: serverTimestamp(),
  };
  if (!payload.createdAt) {
    toSave.createdAt = serverTimestamp();
  }
  await setDoc(ref, toSave, { merge: true });
}

export async function loadPage(projectId: string, pageId: string): Promise<PageTree | null> {
  const ref = doc(db, 'projects', projectId, 'pages', pageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as PageTree;
}

export function subscribePage(projectId: string, pageId: string, onUpdate: (page: PageTree | null) => void) {
  const ref = doc(db, 'projects', projectId, 'pages', pageId);
  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) onUpdate(null);
      else onUpdate({ id: snap.id, ...(snap.data() as any) } as PageTree);
    },
    (err) => console.error('subscribePage error', err)
  );
  return unsub;
}

// --- new helpers for pages collection ---

export async function listPages(projectId: string): Promise<PageTree[]> {
  const col = collection(db, 'projects', projectId, 'pages');
  const q = query(col, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PageTree[];
}

export async function createPage(projectId: string, name = 'Neue Seite', folder: string | null = null) {
  const ref = await addDoc(collection(db, 'projects', projectId, 'pages'), {
    name,
    tree: { id: 'root', type: 'container', children: [] },
    folder: folder ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePage(projectId: string, pageId: string) {
  await deleteDoc(doc(db, 'projects', projectId, 'pages', pageId));
}

export async function renamePage(projectId: string, pageId: string, newName: string) {
  await updateDoc(doc(db, 'projects', projectId, 'pages', pageId), { name: newName, updatedAt: serverTimestamp() });
}

export function subscribePages(projectId: string, onUpdate: (pages: PageTree[]) => void) {
  const col = collection(db, 'projects', projectId, 'pages');
  const q = query(col, orderBy('createdAt', 'asc'));
  const unsub = onSnapshot(
    q,
    (snap) => {
      const pages = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PageTree[];
      onUpdate(pages);
    },
    (err) => console.error('subscribePages error', err)
  );
  return unsub;
}
