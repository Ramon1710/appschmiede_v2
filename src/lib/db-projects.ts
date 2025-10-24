// src/lib/db-projects.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ProjectInfo } from "./editorTypes";

/** Projekte laden, in denen der Nutzer Owner ODER Member ist. */
export async function listProjectsForUser(uid: string): Promise<ProjectInfo[]> {
  const results: Record<string, ProjectInfo> = {};

  // Owner
  const qOwner = query(collection(db, "projects"), where("ownerUid", "==", uid));
  const sOwner = await getDocs(qOwner);
  sOwner.forEach((d) => {
    const data = d.data() as any;
    results[d.id] = {
      id: d.id,
      name: data.name,
      ownerUid: data.ownerUid,
      members: data.members,
    };
  });

  // Member (optional; wenn Index fehlt, ignorieren)
  try {
    const field = `members.${uid}`;
    const qMember = query(
      collection(db, "projects"),
      where(field as any, "in", ["master", "member"])
    );
    const sMember = await getDocs(qMember);
    sMember.forEach((d) => {
      const data = d.data() as any;
      results[d.id] = {
        id: d.id,
        name: data.name,
        ownerUid: data.ownerUid,
        members: data.members,
      };
    });
  } catch {
    // ignorieren – Owner-Liste reicht als Fallback
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

/** Falls du Owner bist: dich selbst als 'master' in members eintragen. */
export async function ensureMaster(projectId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), {
    [`members.${uid}`]: "master",
    updatedAt: serverTimestamp(),
  });
}
