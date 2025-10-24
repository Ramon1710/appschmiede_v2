import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { PageDoc, PageTree } from "./editorTypes";

const PAGES = "pages";
const TREES = "pageTrees";

/** Diagnose: Projekt-Dokument lesen (prüft Zugriff + Existenz) */
export async function getProject(projectId: string) {
  const snap = await getDoc(doc(db, "projects", projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as {
    id: string;
    name?: string;
    ownerUid: string;
    members?: Record<string, "master" | "member">;
  };
}

/** Seiten eines Projekts – nur WHERE, Sortierung clientseitig (kein Composite-Index nötig) */
export async function listPagesByProject(projectId: string): Promise<PageDoc[]> {
  const q = query(collection(db, PAGES), where("projectId", "==", projectId));
  const snap = await getDocs(q);
  const pages = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PageDoc[];
  pages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return pages;
}

export async function createPage(projectId: string, name = "Neue Seite") {
  const pages = await listPagesByProject(projectId);
  const nextOrder = pages.length ? (pages[pages.length - 1].order ?? (pages.length - 1)) + 1 : 0;

  const ref = await addDoc(collection(db, PAGES), {
    projectId,
    name,
    path: name.toLowerCase().replace(/\s+/g, "-"),
    order: nextOrder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isHome: pages.length === 0, // erste Seite = Home
  });

  await setDoc(doc(db, TREES, ref.id), {
    projectId,
    pageId: ref.id,
    tree: { id: "root", type: "container", props: { bg: "#0b1220" }, children: [] },
    updatedAt: Date.now(),
  });

  return ref.id;
}

export async function renamePage(pageId: string, name: string) {
  await updateDoc(doc(db, PAGES, pageId), {
    name,
    path: name.toLowerCase().replace(/\s+/g, "-"),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePage(pageId: string) {
  await deleteDoc(doc(db, PAGES, pageId));
  await deleteDoc(doc(db, TREES, pageId));
}

export async function getPageTree(pageId: string): Promise<PageTree | null> {
  const d = await getDoc(doc(db, TREES, pageId));
  if (!d.exists()) return null;
  const data = d.data() as any;
  return {
    projectId: data.projectId,
    pageId: data.pageId,
    tree: data.tree,
    updatedAt:
      typeof data.updatedAt?.toMillis === "function"
        ? (data.updatedAt as Timestamp).toMillis()
        : data.updatedAt ?? Date.now(),
  };
}

export async function savePageTree(pageId: string, payload: Omit<PageTree, "pageId">) {
  await setDoc(doc(db, TREES, pageId), { ...payload, pageId, updatedAt: Date.now() }, { merge: true });
}

export async function reorderPages(projectId: string, orderedIds: string[]) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, PAGES, id), { order: idx, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

export async function setHomePage(projectId: string, pageId: string) {
  const pages = await listPagesByProject(projectId);
  const batch = writeBatch(db);
  pages.forEach((p) => {
    batch.update(doc(db, PAGES, p.id), { isHome: p.id === pageId, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}
