// path: src/lib/editorTypes.ts

/** Grundtypen für den Editor **/

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

// Einzelnes UI-Element im Editor
export type Node = {
  id: string;
  type: NodeType;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  props?: Record<string, any>;
  style?: Record<string, any>;
  children?: Node[];
};

// Der Baum einer Seite (optional id damit Objektliteral valid ist)
export type PageTree = {
  id?: string;
  name: string;
  // Der Root-Container der Seite
  tree: Node;
  createdAt?: number;
  updatedAt?: number;
};

// Projekt-Typ (klein)
export type Project = {
  id: string;
  name: string;
  pages: PageTree[];
  createdAt?: number;
  updatedAt?: number;
};
