// src/lib/editorTypes.ts

export type NodeType = "text" | "button" | "image" | "input";

export interface Node {
  id: string;
  type: NodeType;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  props?: Record<string, any>;
}

export interface PageTree {
  projectId: string;
  pageId: string;
  tree: {
    id: "root";
    type: "container";
    props?: { bg?: string };
    children: Node[];
  };
  updatedAt: number;
}

export interface PageDoc {
  id: string;
  projectId: string;
  name: string;
  path: string;
  order: number;
  isHome?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface ProjectInfo {
  id: string;
  name?: string;
  ownerUid: string;
  members?: Record<string, "master" | "member">;
}
