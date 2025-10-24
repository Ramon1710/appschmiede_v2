import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export type ProjectDoc = {
  id: string;
  name: string;
  ownerUid: string;
  members?: Record<string, "master" | "member">;
  createdAt?: any;
  updatedAt?: any;
};

/** Projekte laden, in denen der Nutzer Owner ODER Member ist. */
export async function listProjectsForUser(uid: string): Promise<ProjectDoc[]> {
  const results: Record<string, ProjectDoc> = {};

  // 1) Owner
  {
    const q1 = query(collection(db, "projects"), where("ownerUid", "==", uid));
    const snap1 = await getDocs(q1);
    snap1.forEach((d) => (results[d.id] = { id: d.id, ...(d.data() as any) }));
  }

  // 2) Member (members.<uid> in ['master','member'])
  try {
    const field = `members.${uid}`;
    const q2 = query(
      collection(db, "projects"),
      where(field as any, "in", ["master", "member"])
    );
    const snap2 = await getDocs(q2);
    snap2.forEach((d) => (results[d.id] = { id: d.id, ...(d.data() as any) }));
  } catch (e) {
    // Falls 'in'-Query nicht erlaubt / kein Index etc. -> ignorieren, Owner-Liste reicht erst mal
    console.warn("members-query failed/ignored:", e);
  }

  return Object.values(results);
}

/** Projekt erstellen: setzt ownerUid + members[uid]='master' */
export async function createProject(name: string, uid: string): Promise<string> {
  const ref = await addDoc(collection(db, "projects"), {
    name: name || "Neues Projekt",
    ownerUid: uid,
    members: { [uid]: "master" },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Projekt löschen (Rules prüfen Rechte) */
export async function removeProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, "projects", projectId));
}
