// path: src/lib/editorTypes.ts

/** Grundtypen für den Editor **/

import type { Timestamp } from 'firebase/firestore';

// Aktionen, die Buttons und Navigationseinträge unterstützen
export type ButtonAction =
  | 'none'
  | 'navigate'
  | 'url'
  | 'chat'
  | 'call'
  | 'email'
  | 'login'
  | 'logout'
  | 'register'
  | 'reset-password'
  | 'upload-photo'
  | 'record-audio'
  | 'toggle-theme'
  | 'support-ticket';

export type NavbarItem = {
  id: string;
  label: string;
  action: ButtonAction;
  target?: string;
  targetPage?: string;
  url?: string;
  icon?: string;
};

export type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  assignee?: string;
};

export type FolderNode = {
  id: string;
  name: string;
  children?: FolderNode[];
};

export type TimeEntry = {
  id: string;
  label: string;
  seconds: number;
  startedAt?: string;
  endedAt?: string;
};

export type StatusOption = {
  id: string;
  label: string;
  description?: string;
  color?: string;
};

export type AudioNote = {
  id: string;
  label: string;
  createdAt: string;
  url: string;
};

export type BackgroundLayer = {
  id: string;
  url: string;
  positionX: number; // Prozent
  positionY: number; // Prozent
  size: number; // Prozent
};

// Welche Node-Arten erlaubt sind
export type NodeType =
  | 'text'
  | 'button'
  | 'image'
  | 'input'
  | 'container';

export type NodeStyle = Record<string, unknown>;

export type NodeProps = {
  text?: string;
  label?: string;
  icon?: string;
  action?: ButtonAction;
  target?: string;
  targetPage?: string;
  url?: string;
  phoneNumber?: string;
  emailAddress?: string;
  inputType?: string;
  placeholder?: string;
  template?: string;
  src?: string;
  bg?: string;
  component?: string;
  navItems?: NavbarItem[];
  timeTracking?: {
    entries: TimeEntry[];
  };
  statusBoard?: {
    title?: string;
    activeId?: string | null;
    options: StatusOption[];
  };
  folderTree?: FolderNode[];
  tasks?: TaskItem[];
  todoItems?: TaskItem[];
  supportChannel?: 'email' | 'chat' | 'ticket';
  supportTarget?: string;
  calendarFocusDate?: string;
  mapLocation?: string;
  videoUrl?: string;
  audioNotes?: AudioNote[];
  qrUrl?: string;
  coordinates?: string;
  originalFileName?: string;
  bgColor?: string;
  bgLayers?: BackgroundLayer[];
  bgApplyToAll?: boolean;
  [key: string]: unknown;
};

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
