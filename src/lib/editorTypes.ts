export type ComponentType = "text" | "button" | "image" | "input" | "container";

export type BaseNode = {
  id: string;
  type: ComponentType;
  x?: number; // px (absolute auf Canvas)
  y?: number; // px
  w?: number;
  h?: number;
  children?: Node[];
  props?: Record<string, any>;
};

export type Node = BaseNode;

export type PageTree = {
  projectId: string;
  pageId: string;
  tree: Node;
  updatedAt: number;
};

export type PageDoc = {
  id: string;
  projectId: string;
  name: string;
  path: string; // z.B. "home"
  order: number;
  createdAt: number;
  updatedAt: number;
  isHome?: boolean;
};
