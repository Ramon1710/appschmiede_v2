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

export type DropdownOption = {
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

export type SupportTicket = {
  id: string;
  subject: string;
  message?: string;
  createdAt?: string;
  channel?: string;
};

export type AnalyticsMetric = {
  id: string;
  label: string;
  value: string;
  description?: string;
};

export type TableColumn = {
  id: string;
  label: string;
};

export type TableRow = {
  id: string;
  values: string[];
};

export type TableConfig = {
  title?: string;
  columns: TableColumn[];
  rows: TableRow[];
};

export type NewsItem = {
  id: string;
  title: string;
  body?: string;
  imageUrl?: string;
  date?: string;
};

export type MapMode = 'static' | 'live-tracking' | 'route-recording' | 'geofence';

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

export type BautagebuchEntry = {
  id: string;
  date: string; // ISO (YYYY-MM-DD)
  note: string;
};

export type PhaseItem = {
  id: string;
  title: string;
};

export type PhaseCard = {
  id: string;
  phaseId: string;
  title: string;
  description?: string;
};

export type BackgroundLayer = {
  id: string;
  url: string;
  positionX: number; // Prozent
  positionY: number; // Prozent
  size: number; // Prozent
};

export type AvatarTrait = {
  id: string;
  label: string;
  value: string;
  icon?: string;
};

export type AvatarAction = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  accent?: string;
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
  supportTickets?: SupportTicket[];
  supportChannel?: 'email' | 'chat' | 'ticket';
  supportTarget?: string;
  calendarFocusDate?: string;
  mapLocation?: string;
  mapMode?: MapMode;
  mapModeLabel?: string;
  mapInfo?: string;
  mapActionLabel?: string;
  videoUrl?: string;
  audioNotes?: AudioNote[];
  qrUrl?: string;
  coordinates?: string;
  originalFileName?: string;
  bgColor?: string;
  bgLayers?: BackgroundLayer[];
  bgApplyToAll?: boolean;
  uploadAccept?: string;
  uploadMaxSizeMb?: number;
  uploadSuccessMessage?: string;
  adBadge?: string;
  adHeadline?: string;
  adDescription?: string;
  adSubline?: string;
  adCtaLabel?: string;
  adPrice?: string;
  adImageUrl?: string;
  containerBgColor?: string;
  containerBgImageUrl?: string;
  containerBgImagePosX?: number;
  containerBgImagePosY?: number;
  containerBgImageSize?: number;
  qrBackgroundColor?: string;
  qrImageOverride?: string;
  opacity?: number;
  dropdownOptions?: DropdownOption[];
  analyticsMetrics?: AnalyticsMetric[];
  analyticsHighlight?: string;
  tableConfig?: TableConfig;
  newsFeed?: {
    title?: string;
    items: NewsItem[];
  };
  avatarTitle?: string;
  avatarDescription?: string;
  avatarPreviewUrl?: string;
  avatarAccentColor?: string;
  avatarBackgroundColor?: string;
  avatarTraits?: AvatarTrait[];
  avatarActions?: AvatarAction[];
  bautagebuch?: {
    title?: string;
    entries: BautagebuchEntry[];
  };
  phasenboard?: {
    title?: string;
    phases: PhaseItem[];
    cards: PhaseCard[];
  };
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
