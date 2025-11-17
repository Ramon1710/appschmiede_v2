// path: src/lib/editorTypes.ts

/** Grundtypen für den Editor **/

import type { Timestamp } from 'firebase/firestore';

// Welche Node-Arten erlaubt sind
export type NodeType =
  | 'text'
  | 'button'
  | 'image'
  | 'input'
  | 'container'
  | 'chat'
  | 'qr-code'
  | 'time-tracking'
  | 'calendar'
  | 'todo'
  | 'map'
  | 'video'
  | 'table'
  | 'navbar'
  | 'dropdown'
  | 'game'
  | 'avatar';

export type NodeProps = Record<string, unknown>;
export type NodeStyle = Record<string, unknown>;

// Einzelnes UI-Element im Editor
export type Node = {
  id: string;
  type: NodeType;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  props?: NodeProps;
  style?: NodeStyle;
  children?: Node[];
};

// Der Baum einer Seite (optional id damit Objektliteral valid ist)
export type PageTree = {
  id?: string;
  name: string;
  // Der Root-Container der Seite
  tree: Node;
  folder?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

// Projekt-Typ (klein)
export type Project = {
  id: string;
  name: string;
  pages: PageTree[];
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};
