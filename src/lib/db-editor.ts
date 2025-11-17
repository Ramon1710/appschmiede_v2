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
import type { PageTree } from '@/lib/editorTypes';

export type { PageTree } from '@/lib/editorTypes';

const createFallbackTree = (): PageTree['tree'] => ({
  id: 'root',
  type: 'container',
  props: {},
  children: [],
});

type StoredPage = Omit<PageTree, 'id'>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export async function savePage(projectId: string, pageId: string, payload: PageTree) {
  const ref = doc(db, 'projects', projectId, 'pages', pageId);
  const { id: _ignoredId, ...rest } = payload;
  const toSave: DocumentData = {
    ...rest,
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
  const raw = snap.data();
  if (!raw) return null;
  return mapPageDoc(snap.id, raw as DocumentData);
}

export function subscribePage(projectId: string, pageId: string, onUpdate: (page: PageTree | null) => void) {
  const ref = doc(db, 'projects', projectId, 'pages', pageId);
  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      const raw = snap.data();
      if (!raw) {
        onUpdate(null);
        return;
      }
      onUpdate(mapPageDoc(snap.id, raw as DocumentData));
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
  return snap.docs.map((docSnap) => mapPageDoc(docSnap.id, docSnap.data()));
}

export async function createPage(projectId: string, name = 'Neue Seite', folder: string | null = null) {
  const ref = await addDoc(collection(db, 'projects', projectId, 'pages'), {
    name,
    tree: createFallbackTree(),
    folder: folder ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createPageWithContent(
  projectId: string,
  page: Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const col = collection(db, 'projects', projectId, 'pages');
  const ref = page.id ? doc(col, page.id) : doc(col);
  await setDoc(ref, {
    name: page.name,
    tree: page.tree,
    folder: page.folder ?? null,
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
      const pages = snap.docs.map((docSnap) => mapPageDoc(docSnap.id, docSnap.data()));
      onUpdate(pages);
    },
    (err) => console.error('subscribePages error', err)
  );
  return unsub;
}

function mapPageDoc(id: string, rawData: DocumentData): PageTree {
  const raw = rawData as StoredPage & Record<string, unknown>;
  const name = typeof raw.name === 'string' ? raw.name : 'Unbenannte Seite';
  const tree = isRecord(raw.tree) ? (raw.tree as PageTree['tree']) : createFallbackTree();
  const folderValue = raw.folder;
  const folder = typeof folderValue === 'string' || folderValue === null ? folderValue : null;

  const createdAt = ('createdAt' in raw ? (raw.createdAt as PageTree['createdAt']) : null) ?? null;
  const updatedAt = ('updatedAt' in raw ? (raw.updatedAt as PageTree['updatedAt']) : null) ?? null;

  return {
    id,
    name,
    tree,
    folder,
    createdAt,
    updatedAt,
  };
}
