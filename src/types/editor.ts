// src/types/editor.ts
export type NodeType = 'text' | 'button' | 'image' | 'input' | 'container';

export interface NodeBase {
  id: string;
  type: NodeType;
  frame: { x: number; y: number; w: number; h: number };
  style?: Record<string, unknown>;
  props?: Record<string, unknown>;
  children?: string[];
}

export interface Page {
  id: string;
  name: string;
  nodeIds: string[];
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  pages: Page[];
  nodes: Record<string, NodeBase>;
  createdAt: number;
  updatedAt: number;
}
