'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CategorizedToolbox from './CategorizedToolbox';
import QuickButtonsPanel, { type QuickButtonPresetKey } from './QuickButtonsPanel';
import QRCodeButton from '../_extensions/QRCodeButton';
import GuidedTour from '@/components/GuidedTour';
import Header from '@/components/Header';
import UnauthenticatedScreen from '@/components/UnauthenticatedScreen';
import type { PageTree, Node as EditorNode, NodeType, NodeProps, BackgroundLayer } from '@/lib/editorTypes';
import { savePage, subscribePages, createPage, createPageWithContent, deletePage, renamePage, loadPage } from '@/lib/db-editor';
import useAuth from '@/hooks/useAuth';
import type { Project } from '@/lib/db-projects';
import { subscribeProjects } from '@/lib/db-projects';
import JSZip from 'jszip';
import useUserProfile from '@/hooks/useUserProfile';
import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EditorLayoutPreferences } from '@/types/user';
import {
  clearStoredProjectId,
  getStoredProjectId,
  setStoredProjectId as persistStoredProjectId,
} from '@/lib/editor-storage';
import { touchProject } from '@/lib/db-projects';
import { isAdminEmail } from '@/lib/user-utils';

type MutableNode = Omit<EditorNode, 'props' | 'style' | 'children'> & {
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: EditorNode[];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const sanitizeValue = (value: unknown): unknown => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);
  }
  if (isPlainObject(value)) {
    return sanitizeRecord(value as Record<string, unknown>);
  }
  return value;
};

const sanitizeRecord = (input?: Record<string, unknown> | null): Record<string, unknown> | undefined => {
  if (!input) return undefined;
  const entries: Array<[string, unknown]> = [];
  for (const [key, rawValue] of Object.entries(input)) {
    const cleaned = sanitizeValue(rawValue);
    if (cleaned !== undefined) {
      entries.push([key, cleaned]);
    }
  }
  if (!entries.length) return undefined;
  return Object.fromEntries(entries);
};

const sanitizeNode = (node: EditorNode): EditorNode => {
  const mutable: MutableNode = {
    id: node.id,
    type: node.type,
  };
  if (node.x !== undefined) mutable.x = node.x;
  if (node.y !== undefined) mutable.y = node.y;
  if (node.w !== undefined) mutable.w = node.w;
  if (node.h !== undefined) mutable.h = node.h;
  const props = sanitizeRecord(node.props as Record<string, unknown> | undefined);
  if (props) mutable.props = props;
  const style = sanitizeRecord(node.style as Record<string, unknown> | undefined);
  if (style) mutable.style = style;
  const children = (node.children ?? []).map(sanitizeNode);
  mutable.children = children;
  return mutable as EditorNode;
};

const sanitizePage = (page: PageTree): PageTree => ({
  ...page,
  tree: sanitizeNode(page.tree),
});

const DEFAULT_PAGE_BACKGROUND = 'linear-gradient(140deg,#0b0b0f,#111827)';
const DEFAULT_PAGE_BACKGROUND_COLOR = '#05070f';

const normalizeBackgroundColorInput = (value: string): string => {
  const raw = (value ?? '').trim();
  if (!raw) return DEFAULT_PAGE_BACKGROUND_COLOR;
  const lower = raw.toLowerCase();

  if (lower === 'white' || lower === 'weiß' || lower === 'weiss') return '#ffffff';
  if (lower === 'black' || lower === 'schwarz') return '#000000';
  if (lower === 'transparent') return 'transparent';

  // accept hex as-is
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw;

  // allow common CSS names; keep as-is (backgroundColor supports it)
  return raw;
};

const emptyTree: PageTree = {
  id: 'local',
  name: 'Seite 1',
  tree: {
    id: 'root',
    type: 'container',
    props: { bg: DEFAULT_PAGE_BACKGROUND },
    children: [],
  },
};

type ExportablePage = {
  id?: string;
  name: string;
  folder?: string | null;
  tree: PageTree['tree'];
};

type StoredAppTemplate = {
  id: string;
  name: string;
  description?: string | null;
  projectName: string;
  pages: Array<Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>>;
  createdBy?: string | null;
};

type StoredPageTemplate = {
  id: string;
  name: string;
  description?: string | null;
  tree: PageTree['tree'];
  createdBy?: string | null;
};

type MobilePanel = 'toolbox' | 'canvas' | 'properties';

type PanelSide = 'left' | 'right';

const MOBILE_NAV_ITEMS: Array<{ id: MobilePanel; label: string; icon: string }> = [
  { id: 'toolbox', label: 'Bausteine', icon: '🧱' },
  { id: 'canvas', label: 'Vorschau', icon: '📱' },
  { id: 'properties', label: 'Style', icon: '🎨' },
];

const PANEL_LIMITS: Record<PanelSide, { min: number; max: number }> = {
  left: { min: 240, max: 720 },
  right: { min: 240, max: 640 },
};

const clampPanelWidth = (panel: PanelSide, value: number) => {
  const { min, max } = PANEL_LIMITS[panel];
  return Math.min(max, Math.max(min, value));
};

const DEFAULT_LEFT_PANEL_WIDTH = clampPanelWidth('left', 384);
const DEFAULT_RIGHT_PANEL_WIDTH = clampPanelWidth('right', 352);
const DEFAULT_CANVAS_ZOOM = 1;

const CANVAS_ZOOM_MIN = 0.6;
const CANVAS_ZOOM_MAX = 1.4;
const CANVAS_ZOOM_STEP = 0.05;
const clampZoomValue = (value: number) => Math.min(CANVAS_ZOOM_MAX, Math.max(CANVAS_ZOOM_MIN, value));
const UNDO_STACK_LIMIT = 10;
const CANVAS_FRAME = { width: 414, height: 896 } as const;
const MIN_NODE_WIDTH = 40;
const MIN_NODE_HEIGHT = 32;
const makeId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
const clampToRange = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
};
const clampPercentValue = (value: number) => clampToRange(Number.isFinite(value) ? value : 50, 0, 100);
const clampSizeValue = (value: number) => clampToRange(Number.isFinite(value) ? value : 100, 10, 300);

const getFirebaseErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object') return null;
  const anyErr = error as any;
  const code = typeof anyErr.code === 'string' ? anyErr.code : null;
  if (!code) return null;
  return code;
};

const formatTemplateSaveError = (error: unknown, isAdmin: boolean) => {
  const code = getFirebaseErrorCode(error);
  if (isAdmin && code) {
    return `Vorlage konnte nicht gespeichert werden (${code}). Bitte versuche es erneut.`;
  }
  return 'Vorlage konnte nicht gespeichert werden. Bitte versuche es erneut.';
};
const normalizeBackgroundLayers = (raw?: unknown): BackgroundLayer[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const url = typeof (entry as BackgroundLayer).url === 'string' ? (entry as BackgroundLayer).url : '';
      if (!url.trim()) return null;
      return {
        id:
          typeof (entry as BackgroundLayer).id === 'string'
            ? (entry as BackgroundLayer).id
            : typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2),
        url,
        positionX: clampPercentValue((entry as BackgroundLayer).positionX ?? 50),
        positionY: clampPercentValue((entry as BackgroundLayer).positionY ?? 50),
        size: clampSizeValue((entry as BackgroundLayer).size ?? 100),
      } satisfies BackgroundLayer;
    })
    .filter((layer): layer is BackgroundLayer => Boolean(layer));
};
const layerToCss = (layer: BackgroundLayer) =>
  `url("${layer.url}") ${layer.positionX}% ${layer.positionY}% / ${layer.size}% no-repeat`;
const buildLayerCss = (layers: BackgroundLayer[]) => layers.map(layerToCss).join(', ');
const layersEqual = (a: BackgroundLayer[], b: BackgroundLayer[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (!right) return false;
    if (
      left.url !== right.url ||
      left.positionX !== right.positionX ||
      left.positionY !== right.positionY ||
      left.size !== right.size
    ) {
      return false;
    }
  }
  return true;
};

const slugify = (value: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-{2,}/g, '-')
    || 'appschmiede-project';

const pagesModuleTemplate = (pages: ExportablePage[]) =>
  `const pages = ${JSON.stringify(pages, null, 2)};
export default pages;
`;

const webReadmeTemplate = (projectTitle: string) => `# ${projectTitle} – Web Export

Dieses Archiv enthält ein schlankes Vite/React-Projekt mit allen Seiten aus der AppSchmiede. So setzt du es ein:

1. Node 18+ installieren
2. Im Projektordner \`npm install\`
3. \`.env\` anhand von \`.env.example\` anlegen (eigene APIs, Firebase, Stripe etc.)
4. Entwicklung starten: \`npm run dev\`
5. Produktion bauen: \`npm run build && npm run preview\`

Die Renderer-Komponenten findest du in \`src/App.jsx\`. Die rohe Seitenstruktur liegt in \`src/pages-data.js\`.

> Tipp: Ergänze in \`.env\` deine Keys (z. B. \`VITE_FIREBASE_API_KEY\`, \`VITE_API_BASE_URL\`) und verbinde die Werte im Code – Platzhalter sind bereits vorgesehen.
`;

const webPackageJson = (slug: string) =>
  JSON.stringify(
    {
      name: slug,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.3.1',
        vite: '^5.3.4',
      },
    },
    null,
    2
  );

const webEnvExample = `VITE_FIREBASE_API_KEY=PASTE_FIREBASE_KEY
VITE_API_BASE_URL=https://your-api.example.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
`;

const webIndexHtml = (projectTitle: string) => `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectTitle}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

const webMainFile = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

const webAppCss = `:root {
  color-scheme: dark;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #03050a;
  color: #f4f7ff;
}

.app-shell {
  padding: 2rem clamp(1.5rem, 4vw, 4rem);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.app-hero {
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 32px;
  padding: clamp(1.5rem, 4vw, 3rem);
  background: radial-gradient(circle at top, rgba(58, 181, 255, 0.2), transparent 60%), #050914;
}

.eyebrow {
  letter-spacing: 0.4em;
  text-transform: uppercase;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.55);
}

.page-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.page-card {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(6, 10, 18, 0.85);
  padding: 1.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.page-card h2 {
  margin: 0 0 0.35rem;
  font-size: 1.4rem;
}

.node-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.node-block {
  border-radius: 18px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.node-block button {
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 0.9rem;
  font-weight: 600;
  background: linear-gradient(120deg, #38bdf8, #6366f1);
  color: #05070e;
  cursor: pointer;
}

.node-block input {
  width: 100%;
  border-radius: 12px;
  padding: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
  color: inherit;
}

.component-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.75rem;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}
`;

const webAppFile = (projectTitle: string) => `import pages from './pages-data';

const handleAction = (props = {}) => {
  const action = props.action;
  if (!action) return;
  switch (action) {
    case 'url':
    case 'support-ticket':
      if (props.url) window.open(props.url, '_blank');
      break;
    case 'email':
      if (props.emailAddress) window.location.href = 'mailto:' + props.emailAddress;
      break;
    case 'call':
      if (props.phoneNumber) window.location.href = 'tel:' + props.phoneNumber;
      break;
    default:
      break;
  }
};

const NodeRenderer = ({ node }) => {
  if (!node) return null;
  const style = node.style ?? {};
  if (node.type === 'text') {
    return <div className="node-block" style={style}><p>{node.props?.text ?? 'Text'}</p></div>;
  }
  if (node.type === 'button') {
    return (
      <div className="node-block" style={style}>
        <button type="button" onClick={() => handleAction(node.props)}>
          {node.props?.label ?? 'Button'}
        </button>
      </div>
    );
  }
  if (node.type === 'input') {
    return (
      <div className="node-block" style={style}>
        <input placeholder={node.props?.placeholder ?? 'Eingabe'} />
      </div>
    );
  }
  if (node.type === 'image') {
    return (
      <div className="node-block" style={style}>
        <img src={node.props?.src ?? 'https://placehold.co/400x240'} alt={node.props?.alt ?? 'Bild'} style={{ width: '100%', borderRadius: 16 }} />
      </div>
    );
  }
  if (node.type === 'container') {
    return (
      <div className="node-block" style={style}>
        <div className="component-chip">
          <span>Container</span>
          <span>{node.props?.component ?? 'Layout'}</span>
        </div>
        <div className="node-stack">
          {(node.children ?? []).map((child) => (
            <NodeRenderer key={child.id} node={child} />
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const PageCard = ({ page }) => {
  const bg = page.tree?.props?.bg ?? 'linear-gradient(140deg,#0b1220,#050910)';
  return (
    <section className="page-card" style={{ background: bg }}>
      <div className="component-chip">Seite</div>
      <h2>{page.name}</h2>
      {page.folder && <p className="eyebrow">Ordner: {page.folder}</p>}
      <div className="node-stack">
        {(page.tree?.children ?? []).map((node) => (
          <NodeRenderer key={node.id} node={node} />
        ))}
      </div>
    </section>
  );
};

export default function App() {
  const orderedPages = Array.isArray(pages) ? pages : [];
  return (
    <div className="app-shell">
      <div className="app-hero">
        <p className="eyebrow">AppSchmiede Export</p>
        <h1>${projectTitle}</h1>
        <p>Pass das Projekt an, ergänze deine APIs in der .env und veröffentliche es überall.</p>
      </div>
      <main className="page-grid">
        {orderedPages.map((page) => (
          <PageCard key={page.id ?? page.name} page={page} />
        ))}
      </main>
    </div>
  );
}
`;

const androidReadmeTemplate = (projectTitle: string) => `# ${projectTitle} – Android Kit

Dieses Bundle ist ein Expo/React-Native-Projekt. So erzeugst du deine APK:

1. Node 18+ und Expo CLI installieren: \`npm install -g expo-cli eas-cli\`
2. Abhängigkeiten installieren: \`npm install\`
3. \`.env\` aus \`.env.example\` kopieren und eigene Keys eintragen (EXPO_PUBLIC_*)
4. Lokale Vorschau: \`npm run start\` und dann \`a\` für Android-Emulator oder QR-Code scannen.
5. Native Dateien erzeugen: \`npx expo prebuild\`
6. APK-Build über EAS: \`eas build -p android --profile preview\`

Die Seitenstruktur liegt in \`pages-data.js\`. Passe \`App.js\` an, wenn du individuelle Komponenten rendern willst.
`;

const androidEnvExample = `EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com
EXPO_PUBLIC_FIREBASE_API_KEY=PASTE_FIREBASE_KEY
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
`;

const androidPackageJson = (slug: string) =>
  JSON.stringify(
    {
      name: `${slug}-android-kit`,
      version: '1.0.0',
      private: true,
      main: 'node_modules/expo/AppEntry.js',
      scripts: {
        start: 'expo start -c',
        android: 'expo run:android',
        'build-apk': 'eas build -p android --profile preview',
      },
      dependencies: {
        expo: '~51.0.0',
        'expo-status-bar': '~1.12.0',
        react: '18.2.0',
        'react-dom': '18.2.0',
        'react-native': '0.74.3',
      },
      devDependencies: {
        '@babel/core': '^7.24.5',
      },
    },
    null,
    2
  );

const androidAppJson = (projectTitle: string, slug: string) =>
  JSON.stringify(
    {
      expo: {
        name: projectTitle,
        slug: `${slug}-android`,
        version: '1.0.0',
        orientation: 'portrait',
        scheme: slug.replace(/[^a-z0-9]/g, ''),
        userInterfaceStyle: 'automatic',
        splash: {
          backgroundColor: '#05070e',
        },
        updates: {
          enabled: true,
        },
        ios: {
          supportsTablet: true,
        },
        android: {
          adaptiveIcon: {
            backgroundColor: '#05070e',
          },
          package: `com.appschmiede.${slug.replace(/[^a-z0-9]/g, '')}`,
        },
        extra: {
          eas: {
            projectId: '00000000-0000-0000-0000-000000000000',
          },
        },
      },
    },
    null,
    2
  );

const androidAppFile = (projectTitle: string) => `import React from 'react';
import { SafeAreaView, ScrollView, View, Text, Image, TouchableOpacity, TextInput, Linking, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import pages from './pages-data';

const handleAction = (props = {}) => {
  const action = props.action;
  if (!action) return;
  if (action === 'url' && props.url) {
    Linking.openURL(props.url);
  } else if (action === 'email' && props.emailAddress) {
    Linking.openURL('mailto:' + props.emailAddress);
  } else if (action === 'call' && props.phoneNumber) {
    Linking.openURL('tel:' + props.phoneNumber);
  }
};

const NodeRenderer = ({ node }) => {
  if (!node) return null;
  if (node.type === 'text') {
    return (
      <View style={styles.nodeBlock}>
        <Text style={styles.text}>{node.props?.text ?? 'Text'}</Text>
      </View>
    );
  }
  if (node.type === 'button') {
    return (
      <TouchableOpacity style={styles.button} onPress={() => handleAction(node.props)}>
        <Text style={styles.buttonLabel}>{node.props?.label ?? 'Button'}</Text>
      </TouchableOpacity>
    );
  }
  if (node.type === 'input') {
    return (
      <View style={styles.nodeBlock}>
        <TextInput style={styles.input} placeholderTextColor="#9ca3af" placeholder={node.props?.placeholder ?? 'Eingabe'} />
      </View>
    );
  }
  if (node.type === 'image') {
    return (
      <View style={styles.nodeBlock}>
        <Image source={{ uri: node.props?.src ?? 'https://placehold.co/400x240' }} style={styles.image} />
      </View>
    );
  }
  if (node.type === 'container') {
    return (
      <View style={styles.nodeBlock}>
        <Text style={styles.chip}>{node.props?.component ?? 'Container'}</Text>
        <View style={styles.nodeStack}>
          {(node.children ?? []).map((child) => (
            <NodeRenderer key={child.id} node={child} />
          ))}
        </View>
      </View>
    );
  }
  return null;
};

const PageCard = ({ page }) => {
  const bg = page.tree?.props?.bg ?? '#0b1220';
  return (
    <View style={[styles.pageCard, { backgroundColor: bg }]}>
      <Text style={styles.pageTitle}>{page.name}</Text>
      {page.folder && <Text style={styles.folderNote}>Ordner: {page.folder}</Text>}
      <View style={styles.nodeStack}>
        {(page.tree?.children ?? []).map((node) => (
          <NodeRenderer key={node.id} node={node} />
        ))}
      </View>
    </View>
  );
};

export default function App() {
  const list = Array.isArray(pages) ? pages : [];
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heroEyebrow}>AppSchmiede Export</Text>
        <Text style={styles.heroTitle}>${projectTitle}</Text>
        <Text style={styles.heroDescription}>Passe APIs in der .env an und baue mit Expo CLI deine eigene APK.</Text>
        {list.map((page) => (
          <PageCard key={page.id ?? page.name} page={page} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#03050a', flex: 1 },
  scrollContent: { padding: 24, gap: 16 },
  heroEyebrow: { color: '#94a3b8', letterSpacing: 6, textTransform: 'uppercase', fontSize: 12 },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: '700' },
  heroDescription: { color: '#cbd5f5', marginBottom: 8 },
  pageCard: { borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  pageTitle: { color: 'white', fontSize: 20, fontWeight: '600' },
  folderNote: { color: '#cbd5f5', fontSize: 12, marginBottom: 8 },
  nodeStack: { flexDirection: 'column', gap: 12 },
  nodeBlock: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12, backgroundColor: 'rgba(5,9,20,0.55)' },
  text: { color: 'white', fontSize: 16 },
  button: { marginTop: 4, borderRadius: 999, paddingVertical: 12, backgroundColor: '#38bdf8' },
  buttonLabel: { textAlign: 'center', fontWeight: '700', color: '#05070e' },
  input: { borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', color: 'white' },
  image: { width: '100%', height: 160, borderRadius: 16, backgroundColor: '#111' },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', color: '#cbd5f5' },
});
`;

const easJson = `{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
`;

const babelConfig = `module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
`;

const createWebBundleBlob = async (projectTitle: string, slug: string, pages: ExportablePage[]) => {
  const zip = new JSZip();
  const root = zip.folder(`${slug}-web`) ?? zip;
  root.file('README.md', webReadmeTemplate(projectTitle));
  root.file('.env.example', webEnvExample);
  root.file('package.json', webPackageJson(slug));
  root.file('vite.config.js', "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});\n");
  root.file('index.html', webIndexHtml(projectTitle));

  const src = root.folder('src');
  src?.file('main.jsx', webMainFile);
  src?.file('App.jsx', webAppFile(projectTitle));
  src?.file('App.css', webAppCss);
  src?.file('pages-data.js', pagesModuleTemplate(pages));

  const publicFolder = root.folder('public');
  publicFolder?.file(
    'favicon.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="#05070e"/><path d="M30 85 L45 30 L75 30 L90 85" fill="none" stroke="url(#g)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  );

  return zip.generateAsync({ type: 'blob' });
};

const createAndroidBundleBlob = async (projectTitle: string, slug: string, pages: ExportablePage[]) => {
  const zip = new JSZip();
  const root = zip.folder(`${slug}-android-kit`) ?? zip;
  root.file('README.md', androidReadmeTemplate(projectTitle));
  root.file('.env.example', androidEnvExample);
  root.file('package.json', androidPackageJson(slug));
  root.file('app.json', androidAppJson(projectTitle, slug));
  root.file('babel.config.js', babelConfig);
  root.file('eas.json', easJson);
  root.file('pages-data.js', pagesModuleTemplate(pages));
  root.file('App.js', androidAppFile(projectTitle));

  return zip.generateAsync({ type: 'blob' });
};

const hashPage = (page?: PageTree | null): string => {
  if (!page) return '';
  return JSON.stringify({
    id: page.id ?? '',
    name: page.name ?? '',
    folder: page.folder ?? null,
    tree: page.tree ?? emptyTree.tree,
  });
};

type Props = {
  initialPageId?: string | null;
};

type AppTemplateDefinition = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  template: string;
  gradient: string;
};

const APP_TEMPLATES: AppTemplateDefinition[] = [
  {
    id: 'tpl-login',
    title: 'Login',
    subtitle: 'Authentifizierung',
    description: 'Formulare mit Passwort-Logik und Buttons.',
    icon: '🔐',
    template: 'login',
    gradient: 'from-purple-500/40 via-indigo-500/20 to-cyan-500/40',
  },
  {
    id: 'tpl-register',
    title: 'Registrierung',
    subtitle: 'Onboarding',
    description: 'Mehrere Eingabefelder und CTA-Buttons.',
    icon: '📝',
    template: 'register',
    gradient: 'from-emerald-500/40 via-cyan-500/20 to-blue-500/40',
  },
  {
    id: 'tpl-password',
    title: 'Passwort Reset',
    subtitle: 'Support',
    description: 'Reset-Erklärung, Eingabefeld & Call-to-Action.',
    icon: '🔑',
    template: 'password-reset',
    gradient: 'from-amber-500/40 via-orange-500/20 to-rose-500/40',
  },
  {
    id: 'tpl-chat',
    title: 'Chat',
    subtitle: 'Kommunikation',
    description: 'Chatfenster plus Eingabefeld & Aktionen.',
    icon: '💬',
    template: 'chat',
    gradient: 'from-emerald-500/40 via-teal-500/20 to-sky-500/40',
  },
  {
    id: 'tpl-home-4',
    title: 'Startseite (4 Buttons)',
    subtitle: 'Start',
    description: '2×2 Kachel-Layout für eine kompakte Startseite.',
    icon: '🏠',
    template: 'home-grid-4',
    gradient: 'from-emerald-500/40 via-teal-500/20 to-sky-500/40',
  },
  {
    id: 'tpl-home-6',
    title: 'Startseite (6 Buttons)',
    subtitle: 'Start',
    description: '3×2 Kachel-Layout wie ein App-Dashboard.',
    icon: '🏠',
    template: 'home-grid-6',
    gradient: 'from-cyan-500/40 via-sky-500/20 to-indigo-500/40',
  },
  {
    id: 'tpl-home-8',
    title: 'Startseite (8 Buttons)',
    subtitle: 'Start',
    description: '4×2 Kachel-Layout für viele schnelle Aktionen.',
    icon: '🏠',
    template: 'home-grid-8',
    gradient: 'from-purple-500/40 via-indigo-500/20 to-cyan-500/40',
  },
  {
    id: 'tpl-home-10',
    title: 'Startseite (10 Buttons)',
    subtitle: 'Start',
    description: '2×5 Kachel-Layout mit mehr Platz pro Button.',
    icon: '🏠',
    template: 'home-grid-10',
    gradient: 'from-amber-500/40 via-orange-500/20 to-rose-500/40',
  },
  {
    id: 'tpl-home-12',
    title: 'Startseite (12 Buttons)',
    subtitle: 'Start',
    description: '3×4 Kachel-Layout wie im Intranet-App Beispiel.',
    icon: '🏠',
    template: 'home-grid-12',
    gradient: 'from-emerald-500/40 via-teal-500/20 to-sky-500/40',
  },
];

export default function EditorShell({ initialPageId }: Props) {
  const searchParams = useSearchParams();
  const routeParams = useParams<{ projectId?: string; pageId?: string }>();
  const [tree, setTree] = useState<PageTree>(() => sanitizePage(emptyTree));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedNode, setCopiedNode] = useState<EditorNode | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);
  const latestTree = useRef<PageTree>(sanitizePage(emptyTree));
  const pendingSyncHash = useRef<string | null>(null);
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const isAdmin = isAdminEmail(user?.email);

  const queryAppTemplateId = searchParams.get('appTemplateId')?.trim() || null;

  // Unterstütze sowohl ?projectId= als auch ?id=
  const [storedProjectId, setStoredProjectId] = useState<string | null>(null);

  useEffect(() => {
    const saved = getStoredProjectId();
    if (saved) {
      setStoredProjectId(saved);
    }
  }, []);

  const queryProjectId = searchParams.get('projectId') ?? searchParams.get('id');
  const paramsProjectId = typeof routeParams?.projectId === 'string' ? routeParams.projectId : null;
  const [manualProjectId, setManualProjectId] = useState<string | null>(null);
  const derivedProjectId = queryProjectId ?? paramsProjectId ?? storedProjectId ?? null;
  const _projectId = derivedProjectId ?? manualProjectId ?? null;

  useEffect(() => {
    if (!isAdmin) return;
    if (!queryAppTemplateId) return;
    setEditingPageTemplateId(null);
    setEditingAppTemplateId(queryAppTemplateId);
  }, [isAdmin, queryAppTemplateId]);

  useEffect(() => {
    if (!_projectId) {
      clearStoredProjectId();
      return;
    }
    persistStoredProjectId(_projectId);
    if (storedProjectId !== _projectId) {
      setStoredProjectId(_projectId);
    }
  }, [_projectId, storedProjectId]);

  useEffect(() => {
    if (!_projectId) return;
    void touchProject(_projectId, 'opened');
  }, [_projectId]);

  const queryPageId = searchParams.get('pageId') ?? searchParams.get('p');
  const paramsPageId = typeof routeParams?.pageId === 'string' ? routeParams.pageId : null;

  const [currentPageId, setCurrentPageId] = useState<string | null>(initialPageId ?? paramsPageId ?? queryPageId ?? null);
  const [projects, setProjects] = useState<Project[]>([]);
  const project = useMemo(() => projects.find((p) => p.id === _projectId) ?? null, [projects, _projectId]);
  useEffect(() => {
    latestTree.current = tree;
  }, [tree]);

  useEffect(() => {
    const nextResolved = initialPageId ?? paramsPageId ?? queryPageId ?? null;
    if (!nextResolved) return;
    setCurrentPageId((prev) => (prev === nextResolved ? prev : nextResolved));
  }, [initialPageId, paramsPageId, queryPageId]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }
      if (!(_projectId && currentPageId)) return;
      if (!isDirty.current) return;
      const snapshot = latestTree.current;
      (async () => {
        try {
          await savePage(_projectId, currentPageId, snapshot);
          await touchProject(_projectId, 'edited');
          pendingSyncHash.current = hashPage(snapshot);
          isDirty.current = false;
        } catch (err) {
          console.error('Flush before leave failed', err);
        }
      })();
    };
  }, [_projectId, currentPageId]);

  useEffect(() => {
    if (!user?.uid) {
      setProjects([]);
      return;
    }
    const off = subscribeProjects(user.uid, (next) => setProjects(next));
    return () => off();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setLayoutInitialized(false);
      lastSavedLayoutRef.current = null;
      return;
    }
    if (profileLoading) return;
    const prefs = profile?.editorLayout ?? null;
    if (prefs) {
      if (typeof prefs.leftPanelWidth === 'number') {
        setLeftPanelWidth(clampPanelWidth('left', prefs.leftPanelWidth));
      }
      if (typeof prefs.rightPanelWidth === 'number') {
        setRightPanelWidth(clampPanelWidth('right', prefs.rightPanelWidth));
      }
      if (typeof prefs.canvasZoom === 'number') {
        setCanvasZoom(clampZoomValue(prefs.canvasZoom));
      }
      lastSavedLayoutRef.current = {
        leftPanelWidth: typeof prefs.leftPanelWidth === 'number' ? clampPanelWidth('left', prefs.leftPanelWidth) : undefined,
        rightPanelWidth: typeof prefs.rightPanelWidth === 'number' ? clampPanelWidth('right', prefs.rightPanelWidth) : undefined,
        canvasZoom: typeof prefs.canvasZoom === 'number' ? clampZoomValue(prefs.canvasZoom) : undefined,
      };
    } else {
      lastSavedLayoutRef.current = null;
    }
    setLayoutInitialized(true);
  }, [user?.uid, profileLoading, profile?.editorLayout]);

  useEffect(() => {
    if (derivedProjectId || manualProjectId || !projects.length) return;
    const fallbackId = projects[0]?.id;
    if (fallbackId) {
      setManualProjectId(fallbackId);
    }
  }, [derivedProjectId, manualProjectId, projects]);

  useEffect(() => {
    if (!_projectId || !projects.length) return;
    if (projects.some((p) => p.id === _projectId)) return;
    const fallbackId = projects[0]?.id ?? null;
    setManualProjectId(fallbackId);
  }, [_projectId, projects]);

  const [pages, setPages] = useState<PageTree[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const propagateBackgroundToAllPages = useCallback(
    async ({ color, layers, background }: { color: string; layers: BackgroundLayer[]; background: string }) => {
      setPages((prev) =>
        prev.map((page) => ({
          ...page,
          tree: {
            ...page.tree,
            props: {
              ...(page.tree.props ?? {}),
              bgColor: color,
              bgLayers: layers,
              bg: background,
            },
          },
        }))
      );
      if (!(_projectId && pages.length)) return;
      try {
        await Promise.all(
          pages
            .filter((page) => Boolean(page.id))
            .map((page) => {
              const updatedTree = {
                ...page.tree,
                props: {
                  ...(page.tree.props ?? {}),
                  bgColor: color,
                  bgLayers: layers,
                  bg: background,
                },
              };
              return savePage(_projectId, page.id!, { ...page, tree: updatedTree });
            })
        );
        await touchProject(_projectId, 'edited');
      } catch (error) {
        console.error('Hintergrund konnte nicht auf alle Seiten angewendet werden', error);
      }
    },
    [_projectId, pages]
  );
  
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => DEFAULT_LEFT_PANEL_WIDTH);
  const [rightPanelWidth, setRightPanelWidth] = useState(() => DEFAULT_RIGHT_PANEL_WIDTH);
  const panelDragState = useRef<{ panel: PanelSide; startX: number; startWidth: number } | null>(null);
  const [toolboxTab, setToolboxTab] = useState<'components' | 'quick-buttons' | 'templates'>('components');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('canvas');
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);
  const [pageTemplates, setPageTemplates] = useState<StoredPageTemplate[]>([]);
  const [loadingPageTemplates, setLoadingPageTemplates] = useState(false);
  const [savingPageTemplate, setSavingPageTemplate] = useState(false);
  const [savingAppTemplate, setSavingAppTemplate] = useState(false);
  const [appTemplates, setAppTemplates] = useState<StoredAppTemplate[]>([]);
  const [loadingAppTemplates, setLoadingAppTemplates] = useState(false);

  const [editingPageTemplateId, setEditingPageTemplateId] = useState<string | null>(null);
  const [editingAppTemplateId, setEditingAppTemplateId] = useState<string | null>(null);
  const [savingTemplateOverwrite, setSavingTemplateOverwrite] = useState<'page' | 'app' | null>(null);
  const [appTemplateApplying, setAppTemplateApplying] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(DEFAULT_CANVAS_ZOOM);
  const [layoutInitialized, setLayoutInitialized] = useState(false);
  const layoutSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedLayoutRef = useRef<EditorLayoutPreferences | null>(null);

  const stepZoom = (direction: 'in' | 'out') => {
    const delta = direction === 'in' ? CANVAS_ZOOM_STEP : -CANVAS_ZOOM_STEP;
    setCanvasZoom((prev) => clampZoomValue(Number((prev + delta).toFixed(3))));
  };

  const setZoomPercent = (percent: number) => {
    const ratio = percent / 100;
    setCanvasZoom(clampZoomValue(ratio));
  };

  const persistLayout = useCallback(
    async (layout: EditorLayoutPreferences) => {
      if (!user?.uid) return;
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            editorLayout: layout,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        lastSavedLayoutRef.current = layout;
      } catch (error) {
        console.error('Editor-Layout konnte nicht gespeichert werden', error);
      }
    },
    [user?.uid]
  );

  useEffect(() => {
    if (!user?.uid || !layoutInitialized) return;
    const normalizedLayout: EditorLayoutPreferences = {
      leftPanelWidth: clampPanelWidth('left', leftPanelWidth),
      rightPanelWidth: clampPanelWidth('right', rightPanelWidth),
      canvasZoom: Number(clampZoomValue(canvasZoom).toFixed(3)),
    };
    const prev = lastSavedLayoutRef.current;
    const prevZoom = typeof prev?.canvasZoom === 'number' ? Number(prev.canvasZoom.toFixed(3)) : undefined;
    if (
      prev &&
      prev.leftPanelWidth === normalizedLayout.leftPanelWidth &&
      prev.rightPanelWidth === normalizedLayout.rightPanelWidth &&
      prevZoom === normalizedLayout.canvasZoom
    ) {
      return;
    }
    if (layoutSaveTimeout.current) {
      clearTimeout(layoutSaveTimeout.current);
    }
    layoutSaveTimeout.current = setTimeout(() => {
      void persistLayout(normalizedLayout);
      layoutSaveTimeout.current = null;
    }, 800);
    return () => {
      if (layoutSaveTimeout.current) {
        clearTimeout(layoutSaveTimeout.current);
        layoutSaveTimeout.current = null;
      }
    };
  }, [leftPanelWidth, rightPanelWidth, canvasZoom, user?.uid, layoutInitialized, persistLayout]);

  const startPanelDrag = useCallback(
    (panel: PanelSide, event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      panelDragState.current = {
        panel,
        startX: event.clientX,
        startWidth: panel === 'left' ? leftPanelWidth : rightPanelWidth,
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [leftPanelWidth, rightPanelWidth]
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const drag = panelDragState.current;
      if (!drag) return;
      event.preventDefault();
      const delta = event.clientX - drag.startX;
      if (drag.panel === 'left') {
        setLeftPanelWidth(clampPanelWidth('left', drag.startWidth + delta));
      } else {
        setRightPanelWidth(clampPanelWidth('right', drag.startWidth - delta));
      }
    };

    const endDrag = () => {
      if (!panelDragState.current) return;
      panelDragState.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);

    return () => {
      endDrag();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('blur', endDrag);
    };
  }, []);

  useEffect(() => {
    if (_projectId && currentPageId) {
      setTemplateNotice(null);
    }
  }, [_projectId, currentPageId]);

  useEffect(() => {
    const fetchPageTemplates = async () => {
      setLoadingPageTemplates(true);
      try {
        const snap = await getDocs(collection(db, 'pageTemplates'));
        const next = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            name: typeof data?.name === 'string' ? data.name : 'Ohne Titel',
            description: typeof data?.description === 'string' ? data.description : null,
            tree: (data?.tree as PageTree['tree']) ?? emptyTree.tree,
            createdBy: typeof data?.createdBy === 'string' ? data.createdBy : null,
          } satisfies StoredPageTemplate;
        });
        setPageTemplates(next);
      } catch (error) {
        console.error('Seitentemplates konnten nicht geladen werden', error);
      } finally {
        setLoadingPageTemplates(false);
      }
    };
    void fetchPageTemplates();
  }, []);

  useEffect(() => {
    const fetchAppTemplates = async () => {
      setLoadingAppTemplates(true);
      try {
        const snap = await getDocs(collection(db, 'templates'));
        const next = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          const pages = Array.isArray(data?.pages) ? data.pages : [];
          const sanitizedPages = pages
            .map((page: any) => {
              if (!page || typeof page !== 'object') return null;
              const name = typeof page?.name === 'string' ? page.name : 'Seite';
              const folder = typeof page?.folder === 'string' || page?.folder === null ? page.folder : null;
              const tree = page?.tree as PageTree['tree'] | undefined;
              if (!tree || typeof tree !== 'object') return null;
              return {
                name,
                folder,
                tree,
              } satisfies Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>;
            })
            .filter(Boolean) as Array<Omit<PageTree, 'id' | 'createdAt' | 'updatedAt'>>;

          return {
            id: docSnap.id,
            name: typeof data?.name === 'string' ? data.name : 'Ohne Titel',
            description: typeof data?.description === 'string' ? data.description : null,
            projectName: typeof data?.projectName === 'string' ? data.projectName : 'App',
            pages: sanitizedPages,
            createdBy: typeof data?.createdBy === 'string' ? data.createdBy : null,
          } satisfies StoredAppTemplate;
        });
        setAppTemplates(next);
      } catch (error) {
        console.error('App-Templates konnten nicht geladen werden', error);
      } finally {
        setLoadingAppTemplates(false);
      }
    };
    void fetchAppTemplates();
  }, []);

  const downloadAnchor = useRef<HTMLAnchorElement | null>(null);
  const [exporting, setExporting] = useState<'web' | 'apk' | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const hasPages = pages.length > 0;
  const undoStackRef = useRef<PageTree[]>([]);
  const [undoDepth, setUndoDepth] = useState(0);
  const [resettingPage, setResettingPage] = useState(false);
  const [deletingPage, setDeletingPage] = useState(false);
  const clearUndoHistory = useCallback(() => {
    undoStackRef.current = [];
    setUndoDepth(0);
  }, [setUndoDepth]);

  const triggerDownload = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    if (!downloadAnchor.current) {
      downloadAnchor.current = document.createElement('a');
      downloadAnchor.current.style.display = 'none';
      document.body.appendChild(downloadAnchor.current);
    }
    downloadAnchor.current.href = url;
    downloadAnchor.current.download = fileName;
    downloadAnchor.current.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, []);

  const applyTreeUpdate = useCallback(
    (
      updater: (prev: PageTree) => PageTree,
      options?: { markDirty?: boolean; pushHistory?: boolean }
    ): PageTree => {
      let nextState: PageTree | undefined;
      const shouldTrackHistory = options?.pushHistory ?? options?.markDirty !== false;
      setTree((prev) => {
        if (shouldTrackHistory) {
          const snapshot = sanitizePage(prev);
          const nextHistory = [...undoStackRef.current, snapshot];
          undoStackRef.current = nextHistory.length > UNDO_STACK_LIMIT ? nextHistory.slice(-UNDO_STACK_LIMIT) : nextHistory;
          setUndoDepth(undoStackRef.current.length);
        }
        const updated = sanitizePage(updater(prev));
        nextState = updated;
        latestTree.current = updated;
        return updated;
      });
      if (options?.markDirty !== false) {
        isDirty.current = true;
      }
      return nextState ?? latestTree.current;
    },
    [setUndoDepth]
  );

  const handleUndo = useCallback(() => {
    if (!undoStackRef.current.length) return;
    const history = undoStackRef.current;
    const previous = history[history.length - 1];
    undoStackRef.current = history.slice(0, -1);
    setUndoDepth(undoStackRef.current.length);
    applyTreeUpdate(() => previous, { pushHistory: false });
    setSelectedId(null);
  }, [applyTreeUpdate, setSelectedId, setUndoDepth]);

  const handleClearPage = useCallback(() => {
    if (!currentPageId) return;
    applyTreeUpdate((prev) => {
      const bg = typeof prev.tree.props?.bg === 'string' && prev.tree.props.bg.trim() ? prev.tree.props.bg : DEFAULT_PAGE_BACKGROUND;
      return sanitizePage({
        ...prev,
        tree: {
          ...prev.tree,
          props: { ...(prev.tree.props ?? {}), bg },
          children: [],
        },
      });
    });
    setSelectedId(null);
  }, [applyTreeUpdate, currentPageId, setSelectedId]);

  const resetPageToSaved = useCallback(async () => {
    if (!(_projectId && currentPageId)) return;
    setResettingPage(true);
    try {
      const remote = await loadPage(_projectId, currentPageId);
      const fallbackLocal = pages.find((p) => p.id === currentPageId);
      const source = remote ?? fallbackLocal;
      if (!source) {
        window.alert('Es konnte keine gespeicherte Version der Seite geladen werden.');
        return;
      }
      const sanitized = sanitizePage(source);
      applyTreeUpdate(() => sanitized, { markDirty: false, pushHistory: false });
      pendingSyncHash.current = hashPage(sanitized);
      isDirty.current = false;
      setSelectedId(null);
      clearUndoHistory();
      setPages((prev) => prev.map((page) => (page.id === sanitized.id ? sanitized : page)));
    } catch (error) {
      console.error('resetPageToSaved failed', error);
      window.alert('Seite konnte nicht zurückgesetzt werden. Bitte versuche es erneut.');
    } finally {
      setResettingPage(false);
    }
  }, [_projectId, currentPageId, pages, applyTreeUpdate, clearUndoHistory, setSelectedId]);

  const lastProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    const previous = lastProjectIdRef.current;
    if (previous === _projectId) return;
    lastProjectIdRef.current = _projectId;
    if (previous === null) return;
    setCurrentPageId(null);
    setPages([]);
    setSelectedId(null);
    setTemplateNotice(null);
    setEditingPageTemplateId(null);
    setEditingAppTemplateId(null);
    applyTreeUpdate(() => sanitizePage(emptyTree), { markDirty: false });
    pendingSyncHash.current = null;
    isDirty.current = false;
    clearUndoHistory();
  }, [_projectId, applyTreeUpdate, clearUndoHistory]);

  const editingPageTemplate = useMemo(
    () => (editingPageTemplateId ? pageTemplates.find((tpl) => tpl.id === editingPageTemplateId) ?? null : null),
    [editingPageTemplateId, pageTemplates]
  );

  const editingAppTemplate = useMemo(
    () => (editingAppTemplateId ? appTemplates.find((tpl) => tpl.id === editingAppTemplateId) ?? null : null),
    [editingAppTemplateId, appTemplates]
  );

  useEffect(() => {
    return () => {
      if (downloadAnchor.current) {
        downloadAnchor.current.remove();
        downloadAnchor.current = null;
      }
    };
  }, []);

  const onRemove = useCallback((id: string) => {
    applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: (prev.tree.children ?? []).filter((n) => n.id !== id),
      },
    }));
    setSelectedId((current) => (current === id ? null : current));
  }, [applyTreeUpdate]);

  const onMove = useCallback((id: string, dx: number, dy: number) => {
    applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: (prev.tree.children ?? []).map((n) => {
          if (n.id !== id) return n;
          const width = Math.max(MIN_NODE_WIDTH, n.w ?? MIN_NODE_WIDTH);
          const height = Math.max(MIN_NODE_HEIGHT, n.h ?? MIN_NODE_HEIGHT);
          const maxX = Math.max(0, CANVAS_FRAME.width - width);
          const maxY = Math.max(0, CANVAS_FRAME.height - height);
          const nextX = clampToRange((n.x ?? 0) + dx, 0, maxX);
          const nextY = clampToRange((n.y ?? 0) + dy, 0, maxY);
          return { ...n, x: nextX, y: nextY };
        }),
      },
    }));
  }, [applyTreeUpdate]);

  const selectedNode = useMemo(
    () => (tree.tree.children ?? []).find((n) => n.id === selectedId) ?? null,
    [tree, selectedId]
  );

  const handleCopySelected = useCallback(() => {
    if (!selectedNode) return;
    setCopiedNode(selectedNode);
  }, [selectedNode]);

  const handlePasteNode = useCallback(() => {
    if (!copiedNode) return;

    const clone: EditorNode = {
      ...copiedNode,
      id: makeId(),
      props: copiedNode.props ? JSON.parse(JSON.stringify(copiedNode.props)) : undefined,
      style: copiedNode.style ? JSON.parse(JSON.stringify(copiedNode.style)) : undefined,
      children: copiedNode.children ? JSON.parse(JSON.stringify(copiedNode.children)) : undefined,
    };

    const width = Math.max(MIN_NODE_WIDTH, clone.w ?? MIN_NODE_WIDTH);
    const height = Math.max(MIN_NODE_HEIGHT, clone.h ?? MIN_NODE_HEIGHT);
    const maxX = Math.max(0, CANVAS_FRAME.width - width);
    const maxY = Math.max(0, CANVAS_FRAME.height - height);

    const nextX = clampToRange((clone.x ?? 0) + 12, 0, maxX);
    const nextY = clampToRange((clone.y ?? 0) + 12, 0, maxY);

    clone.x = nextX;
    clone.y = nextY;
    clone.w = width;
    clone.h = height;

    applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: [...(prev.tree.children ?? []), clone],
      },
    }));
    setSelectedId(clone.id);
  }, [applyTreeUpdate, copiedNode]);

  const currentPageMeta = useMemo(() => pages.find((p) => p.id === currentPageId) ?? null, [pages, currentPageId]);

  const settingsHref = useMemo(() => (_projectId ? `/editor/settings?projectId=${_projectId}` : null), [_projectId]);

  const backgroundLayers = useMemo(() => normalizeBackgroundLayers(tree.tree.props?.bgLayers), [tree]);
  const backgroundLayerCss = useMemo(() => (backgroundLayers.length ? buildLayerCss(backgroundLayers) : ''), [backgroundLayers]);
  const pageBackgroundColor = useMemo(() => {
    const raw = tree.tree.props?.bgColor;
    return typeof raw === 'string' && raw.trim() ? raw : DEFAULT_PAGE_BACKGROUND_COLOR;
  }, [tree]);
  const backgroundSyncEnabled = Boolean(tree.tree.props?.bgApplyToAll);

  const pageBackground = useMemo(() => {
    if (backgroundLayerCss) return backgroundLayerCss;
    const raw = tree.tree.props?.bg;
    return typeof raw === 'string' && raw.trim() ? raw : DEFAULT_PAGE_BACKGROUND;
  }, [backgroundLayerCss, tree]);

  const setPageBackgroundColor = useCallback(
    (value: string) => {
      const next = typeof value === 'string' ? normalizeBackgroundColorInput(value) : DEFAULT_PAGE_BACKGROUND_COLOR;
      applyTreeUpdate((prev) => ({
        ...prev,
        tree: {
          ...prev.tree,
          props: { ...(prev.tree.props ?? {}), bgColor: next },
        },
      }));
      if (backgroundSyncEnabled) {
        const css = backgroundLayers.length ? buildLayerCss(backgroundLayers) : pageBackground;
        void propagateBackgroundToAllPages({ color: next, layers: backgroundLayers, background: css });
      }
    },
    [applyTreeUpdate, backgroundLayers, backgroundSyncEnabled, pageBackground, propagateBackgroundToAllPages]
  );

  const setBackgroundLayers = useCallback(
    (layers: BackgroundLayer[]) => {
      const sanitized = normalizeBackgroundLayers(layers);
      const css = sanitized.length ? buildLayerCss(sanitized) : '';
      applyTreeUpdate((prev) => ({
        ...prev,
        tree: {
          ...prev.tree,
          props: {
            ...(prev.tree.props ?? {}),
            bgLayers: sanitized,
            bg: css || prev.tree.props?.bg || DEFAULT_PAGE_BACKGROUND,
          },
        },
      }));
      if (backgroundSyncEnabled) {
        const color = pageBackgroundColor;
        const backgroundValue = css || pageBackground;
        void propagateBackgroundToAllPages({ color, layers: sanitized, background: backgroundValue });
      }
    },
    [applyTreeUpdate, backgroundSyncEnabled, pageBackground, pageBackgroundColor, propagateBackgroundToAllPages]
  );

  const setPageBackground = useCallback(
    (value: string) => {
      const next = typeof value === 'string' && value.trim() ? value : DEFAULT_PAGE_BACKGROUND;
      applyTreeUpdate((prev) => ({
        ...prev,
        tree: {
          ...prev.tree,
          props: { ...(prev.tree.props ?? {}), bg: next, bgLayers: [] },
        },
      }));
      if (backgroundSyncEnabled) {
        void propagateBackgroundToAllPages({ color: pageBackgroundColor, layers: [], background: next });
      }
    },
    [applyTreeUpdate, backgroundSyncEnabled, pageBackgroundColor, propagateBackgroundToAllPages]
  );

  const generatePageBackground = useCallback((description: string) => {
    const normalized = (description ?? '').trim();
    const lower = normalized.toLowerCase();

    // Simple "KI"-Interpretation: Farbwünsche -> echter einfarbiger Hintergrund
    if (/(\bweiß\b|\bweiss\b|\bwhite\b)/i.test(lower)) {
      setBackgroundLayers([]);
      setPageBackgroundColor('#ffffff');
      setPageBackground('none');
      return;
    }
    if (/(\bschwarz\b|\bblack\b)/i.test(lower)) {
      setBackgroundLayers([]);
      setPageBackgroundColor('#000000');
      setPageBackground('none');
      return;
    }

    const hexMatch = normalized.match(/#([0-9a-f]{3}|[0-9a-f]{6})/i);
    if (hexMatch) {
      setBackgroundLayers([]);
      setPageBackgroundColor(hexMatch[0]);
      setPageBackground('none');
      return;
    }

    // Fallback: deterministischer Gradient
    const colors = ['#38BDF8', '#6366F1', '#F472B6', '#22D3EE', '#F97316', '#A855F7'];
    const hash = [...normalized].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const first = colors[hash % colors.length];
    const second = colors[(hash + 3) % colors.length];
    const third = colors[(hash + 5) % colors.length];
    const gradient = `linear-gradient(140deg, ${first}, ${second}, ${third})`;
    setPageBackground(gradient);
  }, [setBackgroundLayers, setPageBackground, setPageBackgroundColor]);

  const resetPageBackground = useCallback(() => {
    setBackgroundLayers([]);
    setPageBackgroundColor(DEFAULT_PAGE_BACKGROUND_COLOR);
    setPageBackground(DEFAULT_PAGE_BACKGROUND);
  }, [setBackgroundLayers, setPageBackground, setPageBackgroundColor]);

  const toggleBackgroundSync = useCallback(
    (next: boolean) => {
      applyTreeUpdate((prev) => ({
        ...prev,
        tree: {
          ...prev.tree,
          props: { ...(prev.tree.props ?? {}), bgApplyToAll: next },
        },
      }));
      if (next) {
        const backgroundValue = backgroundLayers.length ? buildLayerCss(backgroundLayers) : pageBackground;
        void propagateBackgroundToAllPages({
          color: pageBackgroundColor,
          layers: backgroundLayers,
          background: backgroundValue,
        });
      }
    },
    [applyTreeUpdate, backgroundLayers, pageBackground, pageBackgroundColor, propagateBackgroundToAllPages]
  );

  useEffect(() => {
    if (!backgroundSyncEnabled) return;
    if (!pages.length) return;
    const targetBackground = backgroundLayers.length ? buildLayerCss(backgroundLayers) : pageBackground;
    const targetColor = pageBackgroundColor;
    const needsSync = pages.some((page) => {
      const props = page.tree.props ?? {};
      const pageLayers = normalizeBackgroundLayers(props.bgLayers);
      const pageBg = pageLayers.length
        ? buildLayerCss(pageLayers)
        : typeof props.bg === 'string' && props.bg.trim()
          ? props.bg
          : DEFAULT_PAGE_BACKGROUND;
      const pageColor = typeof props.bgColor === 'string' && props.bgColor.trim() ? props.bgColor : DEFAULT_PAGE_BACKGROUND_COLOR;
      if (pageBg !== targetBackground) return true;
      if (pageColor !== targetColor) return true;
      if (!layersEqual(pageLayers, backgroundLayers)) return true;
      return false;
    });
    if (!needsSync) return;
    void propagateBackgroundToAllPages({ color: targetColor, layers: backgroundLayers, background: targetBackground });
  }, [
    backgroundSyncEnabled,
    pages,
    backgroundLayers,
    pageBackground,
    pageBackgroundColor,
    propagateBackgroundToAllPages,
  ]);

  const updateNode = useCallback(
    (id: string, patch: Partial<EditorNode>) => {
      applyTreeUpdate((prev) => ({
        ...prev,
        tree: {
          ...prev.tree,
          children: (prev.tree.children ?? []).map((n) => {
            if (n.id !== id) return n;
            const nextProps = patch.props ? { ...(n.props ?? {}), ...patch.props } : n.props;
            const nextStyle = patch.style ? { ...(n.style ?? {}), ...patch.style } : n.style;
            const layoutChanged = 'x' in patch || 'y' in patch || 'w' in patch || 'h' in patch;
            let merged: EditorNode = {
              ...n,
              ...patch,
              props: nextProps,
              style: nextStyle,
            };
            if (layoutChanged) {
              const rawWidth = Math.max(MIN_NODE_WIDTH, merged.w ?? MIN_NODE_WIDTH);
              const rawHeight = Math.max(MIN_NODE_HEIGHT, merged.h ?? MIN_NODE_HEIGHT);
              const width = Math.min(CANVAS_FRAME.width, rawWidth);
              const height = Math.min(CANVAS_FRAME.height, rawHeight);
              const maxX = Math.max(0, CANVAS_FRAME.width - width);
              const maxY = Math.max(0, CANVAS_FRAME.height - height);
              const x = clampToRange(merged.x ?? 0, 0, maxX);
              const y = clampToRange(merged.y ?? 0, 0, maxY);
              merged = { ...merged, x, y, w: width, h: height };
            }
            return merged;
          }),
        },
      }));
    },
    [applyTreeUpdate]
  );

  const persistTemplateApplication = useCallback(
    (nextTree: PageTree | null | undefined, preservedName: string) => {
      if (!nextTree) return false;
      if (!currentPageId) return false;

      setPages((prev) => {
        const existing = prev.find((page) => page.id === currentPageId) ?? null;
        const updatedPage: PageTree = existing
          ? { ...existing, tree: nextTree.tree }
          : {
              id: currentPageId,
              name: preservedName,
              tree: nextTree.tree,
              folder: nextTree.folder ?? null,
            };
        if (existing) {
          return prev.map((page) => (page.id === currentPageId ? updatedPage : page));
        }
        return [...prev, updatedPage];
      });

      if (_projectId && currentPageId && nextTree) {
        const payload = { ...nextTree, name: preservedName };
        latestTree.current = payload;
        (async () => {
          try {
            await savePage(_projectId, currentPageId, payload);
            await touchProject(_projectId, 'edited');
            pendingSyncHash.current = hashPage(payload);
            isDirty.current = false;
          } catch (err) {
            console.error('Template save failed', err);
            isDirty.current = true;
            setTemplateNotice('Vorlage konnte nicht gespeichert werden. Bitte versuche es erneut.');
          }
        })();
      }

      setSelectedId(null);
      return true;
    },
    [_projectId, currentPageId, setPages, setTemplateNotice]
  );

  const applyTemplate = useCallback((template: string) => {
    if (!_projectId) {
      setTemplateNotice('Bitte wähle zuerst ein Projekt oder lege eines im Dashboard an.');
      return false;
    }
    if (!currentPageId) {
      setTemplateNotice('Seiten werden noch geladen. Bitte einen Moment warten.');
      return false;
    }
    setTemplateNotice(null);

    const defaultWidths: Record<NodeType, number> = {
      text: 296,
      button: 240,
      image: 296,
      input: 296,
      container: 296,
    };

    const defaultHeights: Record<NodeType, number> = {
      text: 60,
      button: 48,
      image: 200,
      input: 52,
      container: 200,
    };

    const createNode = (type: NodeType, overrides: Partial<EditorNode> = {}): EditorNode => ({
      id: makeId(),
      type,
      x: overrides.x ?? 32,
      y: overrides.y ?? 96,
      w: overrides.w ?? defaultWidths[type],
      h: overrides.h ?? defaultHeights[type],
      props: overrides.props ?? {},
      style: overrides.style ?? {},
      children: overrides.children,
    });

    const stack = (
      items: Array<{ type: NodeType; node?: Partial<EditorNode> }>,
      startY = 96,
      gap = 24
    ) => {
      let cursor = startY;
      return items.map(({ type, node }) => {
        const next = createNode(type, { ...node, y: node?.y ?? cursor });
        cursor += (next.h ?? defaultHeights[type]) + gap;
        return next;
      });
    };

    let nodes: EditorNode[] = [];
    let background: string | undefined;

    const buildHomeGrid = (buttonCount: number, columns: number, labels: Array<{ label: string; icon: string }>) => {
      background = 'linear-gradient(155deg,#0b0b0f,#0b1220,#111827)';

      const gapX = columns >= 4 ? 8 : 12;
      const gapY = 12;
      const pageWidth = CANVAS_FRAME.width;
      const pageHeight = CANVAS_FRAME.height;
      const minMarginX = 24;
      const availableWidth = pageWidth - minMarginX * 2;
      const tileW = Math.floor((availableWidth - gapX * (columns - 1)) / columns);
      const gridWidth = tileW * columns + gapX * (columns - 1);
      const marginX = Math.max(minMarginX, Math.round((pageWidth - gridWidth) / 2));

      const hero = createNode('image', {
        x: marginX,
        y: 28,
        w: gridWidth,
        h: 170,
        props: {
          src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        },
      });

      const startY = (hero.y ?? 28) + (hero.h ?? 170) + 24;

      const rows = Math.max(1, Math.ceil(buttonCount / columns));
      const bottomPadding = 28;
      const availableHeight = Math.max(160, pageHeight - startY - bottomPadding);
      const tileH = Math.floor((availableHeight - gapY * (rows - 1)) / rows);

      const tiles = Array.from({ length: buttonCount }).map((_, idx) => {
        const row = Math.floor(idx / columns);
        const col = idx % columns;
        const label = labels[idx]?.label ?? `Button ${idx + 1}`;
        const icon = labels[idx]?.icon ?? '🔘';
        return createNode('button', {
          x: marginX + col * (tileW + gapX),
          y: startY + row * (tileH + gapY),
          w: tileW,
          h: tileH,
          props: {
            label,
            icon,
            action: 'none',
          },
          style: {
            borderRadius: 18,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          },
        });
      });

      nodes = [hero, ...tiles];
    };

    if (template === 'login') {
      background = 'linear-gradient(155deg,#0b1220,#142238)';
      nodes = stack([
        {
          type: 'text',
          node: {
            props: { text: 'Willkommen zurück!' },
            style: { fontSize: 28, fontWeight: 600 },
          },
        },
        {
          type: 'text',
          node: {
            h: 72,
            style: { fontSize: 15, lineHeight: 1.5, color: '#cbd5f5' },
            props: { text: 'Melde dich mit deinem Konto an, um deine Projekte zu bearbeiten.' },
          },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Benutzername oder E-Mail', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Passwort', inputType: 'password' } },
        },
        {
          type: 'button',
          node: { props: { label: 'Anmelden', action: 'login' } },
        },
        {
          type: 'button',
          node: {
            w: 260,
            props: {
              label: 'Zur Registrierung',
              action: 'navigate',
              target: 'registrierung',
              targetPage: 'Registrierung',
            },
          },
        },
        {
          type: 'button',
          node: {
            w: 260,
            props: {
              label: 'Passwort vergessen?',
              action: 'navigate',
              target: 'passwort',
              targetPage: 'Passwort',
            },
          },
        },
      ]);
    } else if (template === 'register') {
      background = 'linear-gradient(160deg,#101b32,#172a45)';
      nodes = stack([
        {
          type: 'text',
          node: {
            props: { text: 'Registrierung' },
            style: { fontSize: 27, fontWeight: 600 },
          },
        },
        {
          type: 'text',
          node: {
            h: 72,
            style: { fontSize: 15, lineHeight: 1.5, color: '#cbd5f5' },
            props: { text: 'Lege dein Konto an und starte direkt mit der App-Erstellung.' },
          },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Vorname', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Name', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Adresse', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Unternehmen', inputType: 'text' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'Passwort', inputType: 'password' } },
        },
        {
          type: 'button',
          node: { props: { label: 'Bild hochladen', action: 'upload-photo' } },
        },
        {
          type: 'button',
          node: {
            props: {
              label: 'Registrieren',
              action: 'register',
              target: 'login',
              targetPage: 'Login',
            },
          },
        },
      ]);
    } else if (template === 'password-reset') {
      background = 'linear-gradient(170deg,#0d172b,#1c2d4a)';
      nodes = stack([
        {
          type: 'text',
          node: {
            props: { text: 'Passwort zurücksetzen' },
            style: { fontSize: 26, fontWeight: 600 },
          },
        },
        {
          type: 'text',
          node: {
            h: 72,
            style: { fontSize: 15, lineHeight: 1.55, color: '#cbd5f5' },
            props: {
              text: 'Gib deine E-Mail-Adresse ein. Wir senden dir einen Link, um ein neues Passwort festzulegen.',
            },
          },
        },
        {
          type: 'input',
          node: { props: { placeholder: 'E-Mail-Adresse', inputType: 'email' } },
        },
        {
          type: 'button',
          node: {
            props: {
              label: 'Neues Passwort senden',
              action: 'reset-password',
            },
          },
        },
        {
          type: 'button',
          node: {
            props: {
              label: 'Zurück zum Login',
              action: 'navigate',
              target: 'login',
              targetPage: 'Login',
            },
          },
        },
      ]);
    } else if (template === 'chat') {
      background = 'linear-gradient(155deg,#0a1224,#141f3b)';
      nodes = stack([
        {
          type: 'text',
          node: {
            props: { text: 'Teamchat' },
            style: { fontSize: 28, fontWeight: 600 },
          },
        },
        {
          type: 'text',
          node: {
            h: 72,
            style: { fontSize: 15, lineHeight: 1.5, color: '#cbd5f5' },
            props: { text: 'Bleib mit deinem Projektteam verbunden, tausche Sprachnachrichten aus und teile Bilder.' },
          },
        },
        {
          type: 'container',
          node: {
            h: 320,
            props: { component: 'chat' },
          },
        },
        {
          type: 'input',
          node: {
            h: 56,
            props: { placeholder: 'Nachricht eingeben...' },
          },
        },
        {
          type: 'button',
          node: {
            w: 180,
            props: { label: 'Senden', action: 'chat', target: '+491234567890' },
          },
        },
      ]);
    } else if (template === 'home-grid-4') {
      buildHomeGrid(4, 2, [
        { label: 'Schichtplan', icon: '🗓️' },
        { label: 'News', icon: '📰' },
        { label: 'Wichtige Links', icon: '🔗' },
        { label: 'Kontakt', icon: '☎️' },
      ]);
    } else if (template === 'home-grid-6') {
      buildHomeGrid(6, 3, [
        { label: 'Schichtplan', icon: '🗓️' },
        { label: 'News', icon: '📰' },
        { label: 'Wichtige Links', icon: '🔗' },
        { label: 'Kontakt Mitarbeiter', icon: '📞' },
        { label: 'Betriebsrat', icon: '📣' },
        { label: 'Benefits', icon: '🎁' },
      ]);
    } else if (template === 'home-grid-8') {
      buildHomeGrid(8, 4, [
        { label: 'Schichtplan', icon: '🗓️' },
        { label: 'News', icon: '📰' },
        { label: 'Links', icon: '🔗' },
        { label: 'Kontakt', icon: '☎️' },
        { label: 'Betriebsrat', icon: '📣' },
        { label: 'Benefits', icon: '🎁' },
        { label: 'Social', icon: '❤️' },
        { label: 'Onboarding', icon: '🧑‍🎓' },
      ]);
    } else if (template === 'home-grid-10') {
      buildHomeGrid(10, 2, [
        { label: 'Schichtplan', icon: '🗓️' },
        { label: 'News', icon: '📰' },
        { label: 'Wichtige Links', icon: '🔗' },
        { label: 'Kontakt Mitarbeiter', icon: '📞' },
        { label: 'Betriebsrat NEWS & BV', icon: '📣' },
        { label: 'Benefits', icon: '🎁' },
        { label: 'Social Media', icon: '❤️' },
        { label: 'Mitarbeiterempfehlung', icon: '✅' },
        { label: 'Wichtige Ansprechpartner', icon: '👤' },
        { label: 'Galvapedia', icon: '📚' },
      ]);
    } else if (template === 'home-grid-12') {
      buildHomeGrid(12, 3, [
        { label: 'Schichtpläne', icon: '🗓️' },
        { label: 'NEWS', icon: '📰' },
        { label: 'Wichtige Links', icon: '🔗' },
        { label: 'Kontaktseite Mitarbeiter', icon: '📞' },
        { label: 'Betriebsrat NEWS & BV', icon: '📣' },
        { label: 'Benefits', icon: '🎁' },
        { label: 'Social Media', icon: '❤️' },
        { label: 'Mitarbeiterempfehlung', icon: '✅' },
        { label: 'Wichtige Ansprechpartner', icon: '👤' },
        { label: 'Galvapedia', icon: '📚' },
        { label: 'Mitarbeiterzeitung', icon: '🗞️' },
        { label: 'Onboarding Broschüre', icon: '📘' },
      ]);
    }

    if (!nodes.length) {
      return false;
    }

    const preservedName = currentPageMeta?.name ?? tree.name ?? 'Unbenannte Seite';

    const nextTree = applyTreeUpdate((prev) => ({
      ...prev,
      name: preservedName,
      tree: {
        ...prev.tree,
        props: {
          ...(prev.tree.props ?? {}),
          bg: background ?? prev.tree.props?.bg ?? DEFAULT_PAGE_BACKGROUND,
        },
        children: nodes,
      },
    }));

    return persistTemplateApplication(nextTree, preservedName);
  }, [_projectId, currentPageId, applyTreeUpdate, setPages, setTemplateNotice, currentPageMeta, tree.name]);

  const applySavedPageTemplate = useCallback(
    (template: StoredPageTemplate) => {
      if (!_projectId) {
        setTemplateNotice('Bitte wähle zuerst ein Projekt oder lege eines im Dashboard an.');
        return false;
      }
      if (!currentPageId) {
        setTemplateNotice('Seiten werden noch geladen. Bitte einen Moment warten.');
        return false;
      }
      const preservedName = currentPageMeta?.name ?? tree.name ?? 'Unbenannte Seite';
      const baseTree = template.tree ?? emptyTree.tree;
      const sanitizedTree = sanitizeNode({ ...baseTree, id: 'root' });

      const nextTree = applyTreeUpdate(() => ({
        id: currentPageId,
        name: preservedName,
        tree: sanitizedTree,
      }));

      return persistTemplateApplication(nextTree, preservedName);
    },
    [_projectId, currentPageId, currentPageMeta, tree.name, applyTreeUpdate, persistTemplateApplication, setTemplateNotice]
  );

  const handleSavePageTemplate = useCallback(async () => {
    if (!isAdmin) {
      setTemplateNotice('Nur Admins dürfen Seitenvorlagen speichern.');
      return;
    }
    if (!(_projectId && currentPageId)) {
      setTemplateNotice('Bitte öffne ein Projekt und eine Seite, bevor du eine Vorlage speicherst.');
      return;
    }

    const defaultName = currentPageMeta?.name ?? tree.name ?? 'Neue Seite';
    const name = window.prompt('Name der Seitenvorlage', defaultName)?.trim();
    if (!name) return;
    const description = window.prompt('Kurzbeschreibung (optional)')?.trim() || null;

    const sanitizedTree = sanitizeNode(tree.tree);

    setSavingPageTemplate(true);
    try {
      const payload = {
        name,
        description,
        tree: sanitizedTree,
        createdBy: user?.uid ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'pageTemplates'), payload);
      setPageTemplates((prev) => [{ id: ref.id, ...payload }, ...prev]);
      setTemplateNotice('Seitenvorlage gespeichert.');
    } catch (error) {
      console.error('Seitenvorlage konnte nicht gespeichert werden', error);
      const code = getFirebaseErrorCode(error);
      if (isAdmin && code) {
        setTemplateNotice(`Seitenvorlage konnte nicht gespeichert werden (${code}). Bitte versuche es erneut.`);
      } else {
        setTemplateNotice('Seitenvorlage konnte nicht gespeichert werden. Bitte versuche es erneut.');
      }
    } finally {
      setSavingPageTemplate(false);
    }
  }, [isAdmin, _projectId, currentPageId, currentPageMeta, tree.tree, setPageTemplates, user?.uid, setTemplateNotice]);

  const handleOverwritePageTemplate = useCallback(async () => {
    if (!isAdmin) {
      setTemplateNotice('Nur Admins dürfen Seitenvorlagen speichern.');
      return;
    }
    if (!editingPageTemplateId) {
      setTemplateNotice('Keine Vorlage zum Überschreiben ausgewählt.');
      return;
    }
    if (!(_projectId && currentPageId)) {
      setTemplateNotice('Bitte öffne ein Projekt und eine Seite, bevor du eine Vorlage speicherst.');
      return;
    }

    setSavingTemplateOverwrite('page');
    try {
      const sanitizedTree = sanitizeNode(tree.tree);
      const ref = doc(db, 'pageTemplates', editingPageTemplateId);
      try {
        await updateDoc(ref, {
          tree: sanitizedTree,
          updatedAt: serverTimestamp(),
        });
      } catch (innerError) {
        await setDoc(
          ref,
          {
            tree: sanitizedTree,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      setPageTemplates((prev) =>
        prev.map((tpl) => (tpl.id === editingPageTemplateId ? { ...tpl, tree: sanitizedTree } : tpl))
      );
      setTemplateNotice('Vorlage gespeichert.');
    } catch (error) {
      console.error('Vorlage konnte nicht überschrieben werden', error);
      setTemplateNotice(formatTemplateSaveError(error, isAdmin));
    } finally {
      setSavingTemplateOverwrite((prev) => (prev === 'page' ? null : prev));
    }
  }, [isAdmin, editingPageTemplateId, _projectId, currentPageId, tree.tree, setPageTemplates, setTemplateNotice]);

  const handleSaveAppTemplate = useCallback(async () => {
    if (!isAdmin) {
      setTemplateNotice('Nur Admins dürfen App-Vorlagen speichern.');
      return;
    }
    if (!_projectId || !pages.length) {
      setTemplateNotice('Bitte öffne ein Projekt mit mindestens einer Seite.');
      return;
    }

    const defaultName = project?.name ?? 'App-Vorlage';
    const name = window.prompt('Name der App-Vorlage', defaultName)?.trim();
    if (!name) return;
    const description = window.prompt('Kurzbeschreibung (optional)')?.trim() || null;

    const payloadPages = pages.map((page) => ({
      name: page.name,
      folder: page.folder ?? null,
      tree: sanitizeNode(page.tree),
    }));

    setSavingAppTemplate(true);
    try {
      await addDoc(collection(db, 'templates'), {
        name,
        description,
        projectName: name,
        pages: payloadPages,
        createdBy: user?.uid ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setTemplateNotice('App-Vorlage gespeichert.');
    } catch (error) {
      console.error('App-Vorlage konnte nicht gespeichert werden', error);
      const code = getFirebaseErrorCode(error);
      if (isAdmin && code) {
        setTemplateNotice(`App-Vorlage konnte nicht gespeichert werden (${code}). Bitte versuche es erneut.`);
      } else {
        setTemplateNotice('App-Vorlage konnte nicht gespeichert werden. Bitte versuche es erneut.');
      }
    } finally {
      setSavingAppTemplate(false);
    }
  }, [isAdmin, _projectId, pages, project?.name, user?.uid, setTemplateNotice]);

  const handleOverwriteAppTemplate = useCallback(async () => {
    if (!isAdmin) {
      setTemplateNotice('Nur Admins dürfen App-Vorlagen speichern.');
      return;
    }
    if (!editingAppTemplateId) {
      setTemplateNotice('Keine App-Vorlage zum Überschreiben ausgewählt.');
      return;
    }
    if (!_projectId || !pages.length) {
      setTemplateNotice('Bitte öffne ein Projekt mit mindestens einer Seite.');
      return;
    }

    setSavingTemplateOverwrite('app');
    try {
      const active = latestTree.current;
      const snapshot = pages.map((page) => {
        if (!page) return page as unknown as ExportablePage;
        const isCurrent = Boolean(
          active &&
            ((active.id && page.id && active.id === page.id) || (currentPageId && page.id === currentPageId))
        );
        if (isCurrent && active) {
          return {
            id: active.id ?? page.id,
            name: active.name ?? page.name ?? 'Seite',
            folder: active.folder ?? page.folder ?? null,
            tree: active.tree ?? page.tree,
          };
        }
        return {
          id: page.id,
          name: page.name ?? 'Seite',
          folder: page.folder ?? null,
          tree: page.tree,
        };
      });

      const payloadPages = snapshot.map((page) => ({
        name: page.name,
        folder: page.folder ?? null,
        tree: sanitizeNode(page.tree as any),
      }));

      const ref = doc(db, 'templates', editingAppTemplateId);
      try {
        await updateDoc(ref, {
          pages: payloadPages,
          updatedAt: serverTimestamp(),
        });
      } catch (innerError) {
        await setDoc(
          ref,
          {
            pages: payloadPages,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setAppTemplates((prev) =>
        prev.map((tpl) => (tpl.id === editingAppTemplateId ? { ...tpl, pages: payloadPages as any } : tpl))
      );

      setTemplateNotice('Vorlage gespeichert.');
    } catch (error) {
      console.error('App-Vorlage konnte nicht überschrieben werden', error);
      setTemplateNotice(formatTemplateSaveError(error, isAdmin));
    } finally {
      setSavingTemplateOverwrite((prev) => (prev === 'app' ? null : prev));
    }
  }, [isAdmin, editingAppTemplateId, _projectId, pages, currentPageId, setTemplateNotice]);

  const startEditingPageTemplate = useCallback(
    (template: StoredPageTemplate) => {
      const applied = applySavedPageTemplate(template);
      if (!applied) return;
      setEditingAppTemplateId(null);
      setEditingPageTemplateId(template.id);
      setTemplateNotice(`Bearbeite Vorlage: ${template.name}`);
    },
    [applySavedPageTemplate]
  );

  const applySavedAppTemplateToProject = useCallback(
    async (template: StoredAppTemplate) => {
      if (!isAdmin) {
        setTemplateNotice('Nur Admins dürfen App-Vorlagen bearbeiten.');
        return;
      }
      if (!_projectId) {
        setTemplateNotice('Bitte öffne zuerst ein Projekt.');
        return;
      }
      if (!template.pages.length) {
        setTemplateNotice('Diese Vorlage enthält keine Seiten.');
        return;
      }

      const confirmed = window.confirm(
        'Achtung: Diese Aktion ersetzt alle Seiten im aktuellen Projekt. Fortfahren?'
      );
      if (!confirmed) return;

      setAppTemplateApplying(true);
      setTemplateNotice(null);
      setEditingPageTemplateId(null);

      try {
        setCurrentPageId(null);
        setSelectedId(null);
        clearUndoHistory();
        pendingSyncHash.current = null;
        isDirty.current = false;

        await Promise.allSettled(pages.map((p) => deletePage(_projectId, p.id)));

        await Promise.all(
          template.pages.map(async (page) => {
            await createPageWithContent(_projectId, {
              name: page.name,
              folder: page.folder ?? null,
              tree: sanitizeNode(page.tree as any),
            });
          })
        );

        await touchProject(_projectId, 'edited');
        setEditingAppTemplateId(template.id);
        setTemplateNotice(`Bearbeite Vorlage: ${template.name}`);
      } catch (error) {
        console.error('App-Vorlage konnte nicht angewendet werden', error);
        setTemplateNotice('App-Vorlage konnte nicht geladen werden. Bitte versuche es erneut.');
      } finally {
        setAppTemplateApplying(false);
      }
    },
    [isAdmin, _projectId, pages, deletePage, createPageWithContent, clearUndoHistory, touchProject]
  );

  const addNode = useCallback((type: NodeType, defaultProps: NodeProps = {}) => {
    if (typeof defaultProps.template === 'string') {
      const applied = applyTemplate(defaultProps.template);
      if (applied) {
        return;
      }
    }

    const nodeProps = { ...defaultProps } as NodeProps;
    if ('template' in nodeProps) {
      delete nodeProps.template;
    }

    const newNode: EditorNode = {
      id: makeId(),
      type,
      x: 100,
      y: 100,
      w: 240,
      h: type === 'text' ? 60 : type === 'button' ? 40 : 120,
      props: nodeProps,
    };

    applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        children: [...(prev.tree.children ?? []), newNode],
      },
    }));
    setSelectedId(newNode.id);
  }, [applyTemplate, applyTreeUpdate]);

  useEffect(() => {
    if (!(_projectId && currentPageId)) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await savePage(_projectId, currentPageId, tree);
        await touchProject(_projectId, 'edited');
        pendingSyncHash.current = hashPage(tree);
        isDirty.current = false;
        console.log('✅ Autosave successful');
      } catch (err) {
        console.error('❌ Autosave failed', err);
      }
    }, 2000);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [tree, _projectId, currentPageId]);

  useEffect(() => {
    if (!_projectId) return;
    const off = subscribePages(_projectId, (pgs) => {
      setPages(pgs);
      if (!currentPageId) {
        if (pgs.length > 0) {
          const first = pgs[0];
          setCurrentPageId(first?.id ?? null);
          if (first) {
            applyTreeUpdate(() => first, { markDirty: false });
            pendingSyncHash.current = null;
            isDirty.current = false;
            clearUndoHistory();
          }
        } else {
          (async () => {
            const id = await createPage(_projectId, 'Seite 1');
            setCurrentPageId(id);
          })();
        }
      } else {
        const sel = pgs.find((p) => p.id === currentPageId);
        if (!sel) return;
        const expectedHash = pendingSyncHash.current;
        const incomingHash = hashPage(sel);
        if (expectedHash) {
          if (incomingHash !== expectedHash) {
            return;
          }
          pendingSyncHash.current = null;
          isDirty.current = false;
          applyTreeUpdate(() => sel, { markDirty: false });
          return;
        }
        if (!isDirty.current) {
          applyTreeUpdate(() => sel, { markDirty: false });
        }
      }
    });
    return () => off();
  }, [_projectId, currentPageId, applyTreeUpdate, clearUndoHistory]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget = Boolean(target && (target.closest('input, textarea') || target.contentEditable === 'true'));
      const isCanvasField = Boolean(target?.closest('[data-editor-canvas-field="true"]'));
      if (isEditableTarget && !isCanvasField) {
        return;
      }

      const modKey = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (modKey && key === 'c') {
        event.preventDefault();
        handleCopySelected();
        return;
      }

      if (modKey && key === 'v') {
        event.preventDefault();
        handlePasteNode();
        return;
      }

      if (!selectedId) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      event.preventDefault();
      onRemove(selectedId);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onRemove, handleCopySelected, handlePasteNode]);

  const runAiGenerator = useCallback(async () => {
    if (!aiPrompt.trim()) {
      setAiError('Bitte gib eine Beschreibung ein.');
      return;
    }
    if (!_projectId) {
      setAiError('Bitte öffne zuerst ein Projekt oder speichere dein aktuelles Projekt, bevor du die KI nutzt.');
      return;
    }
    if (!currentPageId) {
      setAiError('Bitte wähle eine Seite aus, damit die KI sie anpassen kann.');
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, pageName: tree.name ?? undefined }),
      });
      if (!response.ok) {
        throw new Error('Die KI konnte die Seite nicht aktualisieren.');
      }
      const data = (await response.json()) as { page?: PageTree; source?: 'openai' | 'fallback'; diagnostics?: { reason?: string } };
      if (!data.page || !data.page.tree) {
        throw new Error('Keine Seitenergebnisse erhalten.');
      }

      const updatedTree = applyTreeUpdate((prev) => {
        const stableName = currentPageMeta?.name ?? prev.name ?? tree.name ?? 'Unbenannte Seite';
        return {
          ...prev,
          name: stableName,
          tree: data.page?.tree ?? prev.tree,
        };
      });
      const preservedName = updatedTree.name ?? currentPageMeta?.name ?? tree.name ?? 'Unbenannte Seite';
      setSelectedId(null);

      await savePage(_projectId, currentPageId, { ...updatedTree, name: preservedName });
      await touchProject(_projectId, 'edited');
      pendingSyncHash.current = hashPage(updatedTree);
      isDirty.current = false;

      if (data.source === 'fallback') {
        const reason = data.diagnostics?.reason ? ` (${data.diagnostics.reason})` : '';
        setAiError(
          `Hinweis: OpenAI wurde nicht genutzt${reason}. Die Seite wurde mit einem lokalen Fallback-Template erstellt. Prüfe OPENAI_API_KEY und Server-Logs.`
        );
      } else {
        setAiPrompt('');
        setAiOpen(false);
      }
    } catch (error) {
      console.error('AI generation failed', error);
      setAiError(error instanceof Error ? error.message : 'Unbekannter Fehler bei der KI-Erstellung.');
    } finally {
      setAiBusy(false);
    }
  }, [_projectId, currentPageId, aiPrompt, applyTreeUpdate, tree.name, currentPageMeta]);

  const promptRenamePage = useCallback(async () => {
    if (!(_projectId && currentPageId)) return;
    const currentName = currentPageMeta?.name ?? tree.name ?? '';
    const nextName = window.prompt('Neuer Seitenname', currentName)?.trim();
    if (!nextName || nextName === currentName) return;
    try {
      await renamePage(_projectId, currentPageId, nextName);
      setPages((prev) => prev.map((p) => (p.id === currentPageId ? { ...p, name: nextName } : p)));
      applyTreeUpdate((prev) => ({ ...prev, name: nextName }), { markDirty: false });
    } catch (error) {
      console.error('renamePage failed', error);
      alert('Seite konnte nicht umbenannt werden.');
    }
  }, [_projectId, currentPageId, currentPageMeta, tree.name, applyTreeUpdate]);

  const buildPagesSnapshot = useCallback((): ExportablePage[] => {
    const active = latestTree.current;
    return pages.map((page) => {
      if (!page) return page as unknown as ExportablePage;
      const isCurrent = Boolean(
        active &&
          ((active.id && page.id && active.id === page.id) || (currentPageId && page.id === currentPageId))
      );
      if (isCurrent && active) {
        return {
          id: active.id ?? page.id,
          name: active.name ?? page.name ?? 'Seite',
          folder: active.folder ?? page.folder ?? null,
          tree: active.tree ?? page.tree,
        };
      }
      return {
        id: page.id,
        name: page.name ?? 'Seite',
        folder: page.folder ?? null,
        tree: page.tree,
      };
    });
  }, [pages, currentPageId]);

  const flushPendingSave = useCallback(async () => {
    if (!(_projectId && currentPageId)) return;
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    if (!isDirty.current) return;
    const snapshot = latestTree.current;
    try {
      await savePage(_projectId, currentPageId, snapshot);
      await touchProject(_projectId, 'edited');
      pendingSyncHash.current = hashPage(snapshot);
      isDirty.current = false;
    } catch (error) {
      console.error('Flush preview save failed', error);
      isDirty.current = true;
    }
  }, [_projectId, currentPageId]);

  const exportJson = useCallback(async () => {
    if (!(_projectId && hasPages)) {
      window.alert('Bitte öffne ein Projekt mit mindestens einer Seite, bevor du exportierst.');
      return;
    }
    setExportDialogOpen(false);
    await flushPendingSave();
    const snapshot = buildPagesSnapshot();
    const payload = {
      projectId: _projectId,
      projectName: project?.name ?? null,
      exportedAt: new Date().toISOString(),
      pages: snapshot,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `appschmiede-${_projectId}.json`);
  }, [_projectId, hasPages, flushPendingSave, buildPagesSnapshot, triggerDownload, project?.name]);

  const exportWebBundle = useCallback(async () => {
    if (!(_projectId && hasPages)) {
      window.alert('Bitte öffne ein Projekt mit mindestens einer Seite, bevor du exportierst.');
      return;
    }
    setExportDialogOpen(false);
    setExporting('web');
    try {
      await flushPendingSave();
      const snapshot = buildPagesSnapshot();
      const projectTitle = project?.name ?? 'AppSchmiede Projekt';
      const slugSource = project?.name ?? _projectId ?? 'appschmiede';
      const blob = await createWebBundleBlob(projectTitle, slugify(slugSource), snapshot);
      triggerDownload(blob, `${slugify(slugSource)}-web.zip`);
    } catch (error) {
      console.error('Web export failed', error);
      window.alert('Web-Export konnte nicht erstellt werden. Bitte versuche es erneut.');
    } finally {
      setExporting((prev) => (prev === 'web' ? null : prev));
    }
  }, [_projectId, hasPages, flushPendingSave, buildPagesSnapshot, project?.name, triggerDownload]);

  const exportAndroidKit = useCallback(async () => {
    if (!(_projectId && hasPages)) {
      window.alert('Bitte öffne ein Projekt mit mindestens einer Seite, bevor du exportierst.');
      return;
    }
    setExportDialogOpen(false);
    setExporting('apk');
    try {
      await flushPendingSave();
      const snapshot = buildPagesSnapshot();
      const projectTitle = project?.name ?? 'AppSchmiede Projekt';
      const slugSource = project?.name ?? _projectId ?? 'appschmiede';
      const blob = await createAndroidBundleBlob(projectTitle, slugify(slugSource), snapshot);
      triggerDownload(blob, `${slugify(slugSource)}-android-kit.zip`);
    } catch (error) {
      console.error('Android export failed', error);
      window.alert('Android-Kit konnte nicht erstellt werden. Bitte versuche es erneut.');
    } finally {
      setExporting((prev) => (prev === 'apk' ? null : prev));
    }
  }, [_projectId, hasPages, flushPendingSave, buildPagesSnapshot, project?.name, triggerDownload]);

  const openBrowserPreview = useCallback(async () => {
    if (!_projectId) {
      window.alert('Bitte öffne zuerst ein Projekt, um die Vorschau zu nutzen.');
      return;
    }
    await flushPendingSave();
    const base = `/preview/${_projectId}`;
    const url = currentPageId ? `${base}?page=${currentPageId}` : base;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [_projectId, currentPageId, flushPendingSave]);

  const handlePageSelection = useCallback(
    (id: string | null, options?: { placeholderName?: string }) => {
      setCurrentPageId(id);
      setSelectedId(null);
      clearUndoHistory();
      pendingSyncHash.current = null;
      isDirty.current = false;

      if (!id) return;

      const sel = pages.find((p) => p.id === id);
      if (sel) {
        applyTreeUpdate(() => sel, { markDirty: false });
        return;
      }

      const backgroundValue = backgroundLayers.length ? buildLayerCss(backgroundLayers) : pageBackground;
      const syncedBackgroundProps = backgroundSyncEnabled
        ? {
            bgApplyToAll: true,
            bgColor: pageBackgroundColor,
            bg: backgroundValue,
            ...(backgroundLayers.length
              ? { bgLayers: backgroundLayers.map((layer) => ({ ...layer })) }
              : {}),
          }
        : { bg: DEFAULT_PAGE_BACKGROUND };

      applyTreeUpdate(
        () => ({
          id: id ?? undefined,
          name: options?.placeholderName ?? 'Neue Seite',
          tree: {
            id: 'root',
            type: 'container',
            props: syncedBackgroundProps,
            children: [],
          },
        }),
        { markDirty: false, pushHistory: false }
      );
    },
    [
      pages,
      applyTreeUpdate,
      clearUndoHistory,
      backgroundLayers,
      backgroundSyncEnabled,
      pageBackground,
      pageBackgroundColor,
    ]
  );

  const createQuickPresetPage = useCallback(
    async (preset: QuickButtonPresetKey) => {
      if (!_projectId) {
        setTemplateNotice('Bitte öffne zuerst ein Projekt.');
        return;
      }

      const makeTableColumn = (label: string) => ({ id: makeId(), label });
      const makeTableRow = (values: string[]) => ({ id: makeId(), values });

      const createNode = (type: NodeType, overrides: Partial<EditorNode> = {}): EditorNode => ({
        id: makeId(),
        type,
        x: overrides.x ?? 32,
        y: overrides.y ?? 96,
        w: overrides.w ?? 296,
        h: overrides.h ?? (type === 'text' ? 60 : type === 'button' ? 56 : 200),
        props: overrides.props ?? {},
        style: overrides.style ?? {},
        children: overrides.children,
      });

      const background = 'linear-gradient(140deg,#0b0b0f,#111827)';

      const presetMeta: Record<QuickButtonPresetKey, { label: string; icon?: string }> = {
        'contact-list': { label: 'Kontaktliste', icon: '📇' },
        'opening-hours': { label: 'Öffnungszeiten', icon: '⏰' },
        'important-links': { label: 'Wichtige Links', icon: '🔗' },
        news: { label: 'News', icon: '📰' },
        'shift-plan': { label: 'Schichtplan', icon: '📅' },
        benefits: { label: 'Benefits', icon: '🎁' },
        contacts: { label: 'Ansprechpartner', icon: '👥' },
      };

      let pageName = 'Neue Seite';
      let nodes: EditorNode[] = [];

      if (preset === 'contact-list') {
        pageName = 'Kontaktliste';
        nodes = [
          createNode('text', {
            y: 64,
            h: 60,
            props: { text: 'Kontaktliste' },
            style: { fontSize: 26, fontWeight: 700 },
          }),
          createNode('text', {
            y: 120,
            h: 56,
            props: { text: 'Hinterlege hier Ansprechpartner inkl. Telefon und E-Mail.' },
            style: { fontSize: 14, lineHeight: 1.55, color: '#cbd5f5' },
          }),
          createNode('container', {
            y: 190,
            h: 260,
            props: {
              component: 'table',
              tableConfig: {
                title: 'Ansprechpartner',
                columns: [makeTableColumn('Name'), makeTableColumn('Telefon'), makeTableColumn('E-Mail')],
                rows: [
                  makeTableRow(['Max Mustermann', '+49 123 4567', 'max@example.com']),
                  makeTableRow(['Erika Musterfrau', '+49 234 5678', 'erika@example.com']),
                ],
              },
            },
          }),
          createNode('button', {
            y: 470,
            w: 296,
            h: 56,
            props: { label: 'E-Mail schreiben', icon: '✉️', action: 'email', emailAddress: 'info@example.com' },
          }),
          createNode('button', {
            y: 540,
            w: 296,
            h: 56,
            props: { label: 'Anrufen', icon: '📞', action: 'call', phoneNumber: '+491234567890' },
          }),
        ];
      } else if (preset === 'opening-hours') {
        pageName = 'Öffnungszeiten';
        nodes = [
          createNode('text', {
            y: 64,
            props: { text: 'Öffnungszeiten' },
            style: { fontSize: 26, fontWeight: 700 },
          }),
          createNode('text', {
            y: 120,
            h: 56,
            props: { text: 'Passe die Zeiten an eure Standorte und Feiertage an.' },
            style: { fontSize: 14, lineHeight: 1.55, color: '#cbd5f5' },
          }),
          createNode('container', {
            y: 190,
            h: 320,
            props: {
              component: 'table',
              tableConfig: {
                title: 'Zeiten',
                columns: [makeTableColumn('Tag'), makeTableColumn('Von'), makeTableColumn('Bis')],
                rows: [
                  makeTableRow(['Mo', '08:00', '17:00']),
                  makeTableRow(['Di', '08:00', '17:00']),
                  makeTableRow(['Mi', '08:00', '17:00']),
                  makeTableRow(['Do', '08:00', '17:00']),
                  makeTableRow(['Fr', '08:00', '15:00']),
                  makeTableRow(['Sa', 'geschlossen', '—']),
                  makeTableRow(['So', 'geschlossen', '—']),
                ],
              },
            },
          }),
        ];
      } else if (preset === 'important-links') {
        pageName = 'Wichtige Links';
        nodes = [
          createNode('text', {
            y: 64,
            props: { text: 'Wichtige Links' },
            style: { fontSize: 26, fontWeight: 700 },
          }),
          createNode('text', {
            y: 120,
            h: 56,
            props: { text: 'Sammle interne Tools und Dokumente an einem Ort.' },
            style: { fontSize: 14, lineHeight: 1.55, color: '#cbd5f5' },
          }),
          createNode('button', {
            y: 200,
            props: { label: 'Intranet', icon: '🔗', action: 'url', url: 'https://example.com' },
          }),
          createNode('button', {
            y: 270,
            props: { label: 'Wiki / Doku', icon: '📚', action: 'url', url: 'https://example.com/wiki' },
          }),
          createNode('button', {
            y: 340,
            props: { label: 'Support', icon: '🎫', action: 'url', url: 'https://example.com/support' },
          }),
        ];
      } else if (preset === 'news') {
        pageName = 'News';
        nodes = [
          createNode('text', {
            y: 64,
            props: { text: 'News' },
            style: { fontSize: 26, fontWeight: 700 },
          }),
          createNode('text', {
            y: 120,
            h: 80,
            props: { text: 'Pflege hier eure aktuellen Meldungen inkl. Bildern.' },
            style: { fontSize: 14, lineHeight: 1.6, color: '#cbd5f5' },
          }),
          createNode('container', {
            y: 210,
            h: 620,
            props: {
              component: 'news',
              newsFeed: {
                title: 'Aktuelle News',
                items: [
                  {
                    id: makeId(),
                    title: 'Neue Info',
                    body: 'Beispieltext – ändere Titel, Text und Bild im Eigenschaften-Panel.',
                    imageUrl: 'https://placehold.co/600x360/0b0b0f/f1f5f9?text=News',
                    date: new Date().toISOString(),
                  },
                ],
              },
            },
          }),
        ];
      } else if (preset === 'shift-plan') {
        pageName = 'Schichtplan';
        nodes = [
          createNode('text', {
            y: 64,
            props: { text: 'Schichtplan' },
            style: { fontSize: 26, fontWeight: 700 },
          }),
          createNode('text', {
            y: 120,
            h: 56,
            props: { text: 'Beispiel-Daten – ersetze sie durch euren echten Plan.' },
            style: { fontSize: 14, lineHeight: 1.55, color: '#cbd5f5' },
          }),
          createNode('container', {
            y: 190,
            h: 300,
            props: {
              component: 'table',
              tableConfig: {
                title: 'Diese Woche',
                columns: [makeTableColumn('Datum'), makeTableColumn('Schicht'), makeTableColumn('Team')],
                rows: [
                  makeTableRow(['Mo', 'Früh', 'Team A']),
                  makeTableRow(['Di', 'Spät', 'Team B']),
                  makeTableRow(['Mi', 'Früh', 'Team A']),
                ],
              },
            },
          }),
        ];
      } else if (preset === 'benefits') {
        pageName = 'Benefits';
        nodes = [
          createNode('text', {
            y: 64,
            props: { text: 'Benefits' },
            style: { fontSize: 26, fontWeight: 700 },
          }),
          createNode('text', {
            y: 120,
            h: 140,
            props: {
              text: '• JobRad / ÖPNV\n• Weiterbildung\n• Verpflegung\n• Events\n\nPasse die Inhalte an euer Unternehmen an.',
            },
            style: { fontSize: 14, lineHeight: 1.6, color: '#cbd5f5' },
          }),
        ];
      } else if (preset === 'contacts') {
        pageName = 'Ansprechpartner';
        nodes = [
          createNode('text', {
            y: 64,
            props: { text: 'Wichtige Ansprechpartner' },
            style: { fontSize: 26, fontWeight: 700 },
          }),
          createNode('container', {
            y: 130,
            h: 300,
            props: {
              component: 'table',
              tableConfig: {
                title: 'Kontakte',
                columns: [makeTableColumn('Thema'), makeTableColumn('Name'), makeTableColumn('Kontakt')],
                rows: [
                  makeTableRow(['IT', 'Alex', 'it@example.com']),
                  makeTableRow(['HR', 'Sam', 'hr@example.com']),
                  makeTableRow(['Facility', 'Pat', '+49 111 222']),
                ],
              },
            },
          }),
        ];
      }

      const tree: PageTree['tree'] = sanitizeNode({
        id: 'root',
        type: 'container',
        props: { bg: background },
        children: nodes,
      } as any);

      try {
        const pageId = await createPageWithContent(_projectId, { name: pageName, folder: null, tree });

        const meta = presetMeta[preset];

        if (currentPageId) {
          const buttonId = makeId();
          const buttonLabel = meta?.label ?? pageName;
          const buttonIcon = meta?.icon;

          applyTreeUpdate((prev) => {
            const children = prev.tree.children ?? [];
            const maxBottom = children.reduce((acc, child) => {
              const y = typeof child.y === 'number' ? child.y : 0;
              const h = typeof child.h === 'number' ? child.h : 0;
              return Math.max(acc, y + h);
            }, 0);
            const nextY = Math.min(820, Math.max(80, maxBottom + 16));

            const navButton: EditorNode = {
              id: buttonId,
              type: 'button',
              x: 32,
              y: nextY,
              w: 296,
              h: 56,
              props: {
                label: buttonLabel,
                icon: buttonIcon,
                action: 'navigate',
                targetPage: pageId,
              },
            };

            return {
              ...prev,
              tree: {
                ...prev.tree,
                children: [...children, navButton],
              },
            };
          });

          setSelectedId(buttonId);
          setTemplateNotice(null);
          return;
        }

        // Fallback: keine aktuelle Seite offen -> auf die neu erstellte Seite wechseln
        handlePageSelection(pageId, { placeholderName: pageName });
        setTemplateNotice(null);
      } catch (error) {
        console.error('Quick preset page creation failed', error);
        setTemplateNotice('Seite konnte nicht erstellt werden. Bitte versuche es erneut.');
      }
    },
    [_projectId, applyTreeUpdate, createPageWithContent, currentPageId, handlePageSelection, setSelectedId, setTemplateNotice]
  );

  const handleDeleteCurrentPage = useCallback(async () => {
    if (!(_projectId && currentPageId)) return;
    if (pages.length <= 1) {
      window.alert('Mindestens eine Seite muss bestehen. Erstelle erst eine neue Seite, bevor du diese löscht.');
      return;
    }
    const deletingPageId = currentPageId;
    const fallback = pages.find((page) => page.id !== deletingPageId) ?? null;
    if (!fallback) return;
    const confirmed = window.confirm('Seite wirklich löschen?');
    if (!confirmed) return;
    setDeletingPage(true);
    try {
      await deletePage(_projectId, deletingPageId);
      handlePageSelection(fallback.id ?? null, { placeholderName: fallback.name });
      setPages((prev) => prev.filter((page) => page.id !== deletingPageId));
    } catch (error) {
      console.error('Seite konnte nicht gelöscht werden', error);
      window.alert('Seite konnte nicht gelöscht werden. Bitte versuche es erneut.');
    } finally {
      setDeletingPage(false);
    }
  }, [_projectId, currentPageId, pages, handlePageSelection]);

  const templateControlsDisabled = !_projectId || !currentPageId;

  const templateContent = (
    <div className="space-y-4">
      <p className="text-xs text-neutral-400">
        Wähle eine Vorlage, um die aktuelle Seite durch ein kuratiertes Layout zu ersetzen.
      </p>
      {templateNotice && (
        <p className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{templateNotice}</p>
      )}
      {isAdmin && (
        <div className="space-y-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-50">
          <div className="font-semibold text-emerald-100">Admin-Aktionen</div>
          <p className="text-[11px] text-emerald-100/80">Speichere eigene Seiten- oder App-Vorlagen für alle Nutzer.</p>
          {(editingPageTemplate || editingAppTemplate) && (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-50">
              <div className="font-semibold text-emerald-100">Aktive Vorlagen-Bearbeitung</div>
              {editingPageTemplate && <div>Seitenvorlage: <span className="font-semibold">{editingPageTemplate.name}</span></div>}
              {editingAppTemplate && <div>App-Vorlage: <span className="font-semibold">{editingAppTemplate.name}</span></div>}
            </div>
          )}
          <div className="flex flex-col gap-2 text-sm">
            <button
              type="button"
              className="rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-3 py-2 font-semibold text-emerald-50 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSavePageTemplate}
              disabled={templateControlsDisabled || savingPageTemplate}
            >
              {savingPageTemplate ? 'Speichere Seitenvorlage…' : 'Aktuelle Seite als Vorlage speichern'}
            </button>
            {editingPageTemplateId && !editingAppTemplateId && (
              <button
                type="button"
                className="rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-3 py-2 font-semibold text-emerald-50 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleOverwritePageTemplate}
                disabled={templateControlsDisabled || savingTemplateOverwrite === 'page'}
              >
                {savingTemplateOverwrite === 'page' ? 'Speichere Vorlage…' : 'Vorlage speichern'}
              </button>
            )}
            <button
              type="button"
              className="rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-3 py-2 font-semibold text-cyan-50 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSaveAppTemplate}
              disabled={!_projectId || !pages.length || savingAppTemplate}
            >
              {savingAppTemplate ? 'Speichere App-Vorlage…' : 'Projekt als App-Vorlage speichern'}
            </button>
            {editingAppTemplateId && (
              <button
                type="button"
                className="rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-3 py-2 font-semibold text-cyan-50 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleOverwriteAppTemplate}
                disabled={!_projectId || !pages.length || savingTemplateOverwrite === 'app'}
              >
                {savingTemplateOverwrite === 'app' ? 'Speichere Vorlage…' : 'Vorlage speichern'}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {APP_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            disabled={templateControlsDisabled}
            onClick={() => {
              if (templateControlsDisabled) {
                setTemplateNotice('Bitte öffne ein Projekt und eine Seite, bevor du Vorlagen nutzt.');
                return;
              }
              const applied = applyTemplate(tpl.template);
              if (applied) {
                setTemplateNotice(null);
              }
            }}
            className={`group w-full rounded-2xl border px-4 py-4 text-left transition ${
              templateControlsDisabled
                ? 'cursor-not-allowed border-white/5 bg-white/5 text-neutral-500 opacity-60'
                : 'border-white/10 bg-white/5 hover:border-emerald-400/50 hover:bg-white/10'
            }`}
          >
            <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${tpl.gradient} px-3 py-1 text-[11px] font-semibold text-white`}>
              <span>{tpl.icon}</span>
              <span>{tpl.subtitle}</span>
            </div>
            <div className="mt-3 text-lg font-semibold text-white">{tpl.title}</div>
            <p className="text-sm text-neutral-300">{tpl.description}</p>
            <span className="mt-3 inline-flex items-center text-[11px] font-semibold text-emerald-300">
              Vorlage anwenden
              <span className="ml-1 transition group-hover:translate-x-1">→</span>
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">Gespeicherte Seitenvorlagen</div>
        {loadingPageTemplates ? (
          <p className="text-xs text-neutral-400">Lade gespeicherte Vorlagen…</p>
        ) : pageTemplates.length === 0 ? (
          <p className="text-xs text-neutral-500">Noch keine Seitenvorlagen verfügbar.</p>
        ) : (
          <div className="space-y-3">
            {pageTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                disabled={templateControlsDisabled}
                onClick={() => applySavedPageTemplate(tpl)}
                className={`group w-full rounded-2xl border px-4 py-4 text-left transition ${
                  templateControlsDisabled
                    ? 'cursor-not-allowed border-white/5 bg-white/5 text-neutral-500 opacity-60'
                    : 'border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10'
                }`}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-cyan-100">
                  <span>🗂️</span>
                  <span>Gespeicherte Vorlage</span>
                </div>
                <div className="mt-3 text-lg font-semibold text-white">{tpl.name}</div>
                {tpl.description && <p className="text-sm text-neutral-300">{tpl.description}</p>}
                {isAdmin && !templateControlsDisabled && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEditingPageTemplate(tpl);
                      }}
                      className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                    >
                      Bearbeiten
                    </button>
                  </div>
                )}
                <span className="mt-3 inline-flex items-center text-[11px] font-semibold text-cyan-200">
                  Vorlage anwenden
                  <span className="ml-1 transition group-hover:translate-x-1">→</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">Gespeicherte App-Vorlagen</div>
          {loadingAppTemplates ? (
            <p className="text-xs text-neutral-400">Lade gespeicherte App-Vorlagen…</p>
          ) : appTemplates.length === 0 ? (
            <p className="text-xs text-neutral-500">Noch keine App-Vorlagen verfügbar.</p>
          ) : (
            <div className="space-y-3">
              {appTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  disabled={appTemplateApplying || !_projectId}
                  onClick={() => void applySavedAppTemplateToProject(tpl)}
                  className={`group w-full rounded-2xl border px-4 py-4 text-left transition ${
                    appTemplateApplying || !_projectId
                      ? 'cursor-not-allowed border-white/5 bg-white/5 text-neutral-500 opacity-60'
                      : 'border-white/10 bg-white/5 hover:border-emerald-400/50 hover:bg-white/10'
                  }`}
                >
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                    <span>📦</span>
                    <span>App-Vorlage</span>
                  </div>
                  <div className="mt-3 text-lg font-semibold text-white">{tpl.name}</div>
                  {tpl.description && <p className="text-sm text-neutral-300">{tpl.description}</p>}
                  <span className="mt-3 inline-flex items-center text-[11px] font-semibold text-emerald-200">
                    {appTemplateApplying ? 'Lade Vorlage…' : 'Vorlage zum Bearbeiten laden'}
                    <span className="ml-1 transition group-hover:translate-x-1">→</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const zoomPercent = Math.round(canvasZoom * 100);
  const ZoomControl = ({ className = '' }: { className?: string }) => (
    <div
      className={`flex items-center gap-2 rounded-full border border-white/10 bg-[#05070f]/90 px-3 py-1.5 text-[11px] text-neutral-100 shadow-xl ${className}`}
    >
      <button
        type="button"
        className="rounded-full border border-white/20 px-2 text-base leading-none text-neutral-200 transition hover:bg-white/10"
        onClick={() => stepZoom('out')}
        aria-label="Zoom verkleinern"
      >−</button>
      <input
        type="range"
        min={CANVAS_ZOOM_MIN * 100}
        max={CANVAS_ZOOM_MAX * 100}
        step={CANVAS_ZOOM_STEP * 100}
        value={zoomPercent}
        onChange={(event) => setZoomPercent(Number(event.target.value))}
        className="h-1.5 w-28 accent-emerald-400"
        aria-label="Zoomfaktor"
      />
      <span className="w-12 text-center font-semibold tracking-widest">{zoomPercent}%</span>
      <button
        type="button"
        className="rounded-full border border-white/20 px-2 text-base leading-none text-neutral-200 transition hover:bg-white/10"
        onClick={() => stepZoom('in')}
        aria-label="Zoom vergrößern"
      >+</button>
    </div>
  );
  const canUndo = undoDepth > 0;
  const canResetPage = Boolean(currentPageId) && !resettingPage;
  const canClearPage = Boolean(currentPageId) && !resettingPage;
  const HistoryControls = ({ className = '' }: { className?: string }) => (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleUndo}
        disabled={!canUndo}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#05070f]/90 text-lg text-neutral-100 shadow-xl transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Letzten Schritt rückgängig machen (${Math.min(undoDepth, UNDO_STACK_LIMIT)}/${UNDO_STACK_LIMIT})`}
      >
        <span aria-hidden="true">↺</span>
      </button>
      <button
        type="button"
        onClick={handleClearPage}
        disabled={!canClearPage}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#05070f]/90 px-3 py-1.5 text-[11px] font-semibold text-neutral-100 shadow-xl transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Seite leeren"
      >
        <span className="text-base">🗑️</span>
        <span>Seite leeren</span>
      </button>
      <button
        type="button"
        onClick={resetPageToSaved}
        disabled={!canResetPage}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#05070f]/90 px-3 py-1.5 text-[11px] font-semibold text-neutral-100 shadow-xl transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="text-base">⟳</span>
        <span>{resettingPage ? 'Setze zurück…' : 'Seite zurücksetzen'}</span>
      </button>
    </div>
  );

  const toolboxContent = (
    <div className="h-full overflow-y-auto pr-1">
      <CategorizedToolbox onAdd={addNode} />
    </div>
  );

  const editorTourSteps = [
    {
      id: 'editor-actions',
      title: 'Export, QR & KI',
      description: 'Hier findest du Export, QR-Vorschau und den KI-Assistenten – plus den Zugriff auf Seiteneinstellungen.',
    },
    {
      id: 'editor-toolbox',
      title: 'Bausteine & Vorlagen',
      description: 'Ziehe Komponenten oder komplette Vorlagen direkt in deine Seite oder nutze das Dropdown für schnelle Layouts.',
    },
    {
      id: 'editor-canvas',
      title: 'Interaktive Arbeitsfläche',
      description: 'Wähle Elemente aus, verschiebe sie per Drag & Drop und nutze die Handles zum Skalieren.',
    },
    {
      id: 'editor-properties',
      title: 'Eigenschaften & Styles',
      description: 'Passe Texte, Aktionen, Hintergründe und responsive Einstellungen deiner ausgewählten Bausteine an.',
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#05070e] text-white">
        <Header />
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-sm text-neutral-400">Lade Benutzerstatus…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <UnauthenticatedScreen
        badge="Editor"
        description="Der Editor steht nur angemeldeten Accounts zur Verfügung. Melde dich an, um deine Projekte zu laden oder neue Apps zu erstellen."
      />
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col bg-[#05070e]">
        <Header />
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          <aside
            className="hidden flex-shrink-0 flex-col border-r border-[#222] bg-[#05070e]/70 backdrop-blur-sm lg:flex"
            style={{ width: `${leftPanelWidth}px` }}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-[#111]/60 bg-[#0b0b0f]/95 px-4 py-4" data-tour-id="editor-actions">
                <div className="flex items-center justify-between">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
                  >
                    <span className="text-lg" aria-hidden="true">←</span>
                    <span>Dashboard</span>
                  </Link>
                  <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">Editor</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="flex-1 min-w-[9rem] rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:bg-white/10 disabled:opacity-40"
                    onClick={() => setExportDialogOpen(true)}
                    disabled={!hasPages}
                  >
                    Export
                  </button>
                  <QRCodeButton
                    projectId={_projectId}
                    pageId={currentPageId}
                    onBeforeOpen={flushPendingSave}
                    className="flex-1 min-w-[9rem]"
                  />
                  <button
                    className="flex-1 min-w-[9rem] rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:bg-white/10"
                    onClick={() => {
                      setAiError(null);
                      setAiOpen(true);
                    }}
                  >
                    KI
                  </button>
                  {settingsHref ? (
                    <Link
                      href={settingsHref}
                      className="flex-1 min-w-[9rem] rounded border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold transition hover:bg-white/10"
                    >
                      ⚙️ Einstellungen
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 min-w-[9rem] rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-400"
                    >
                      ⚙️ Einstellungen
                    </button>
                  )}
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">Projekt</p>
                  <div className="mt-2 text-sm font-semibold text-neutral-50">{project?.name ?? 'Kein Projekt geladen'}</div>
                  {project?.description && <p className="text-xs text-neutral-400">{project.description}</p>}
                  <div className="mt-3 flex gap-2">
                    <select
                      className="w-full rounded-xl border border-[#333] bg-neutral-900 px-3 py-2 text-sm"
                      value={currentPageId ?? ''}
                      onChange={(event) => handlePageSelection(event.target.value || null)}
                      disabled={!pages.length}
                    >
                      {pages.length === 0 ? (
                        <option value="">Keine Seiten vorhanden</option>
                      ) : (
                        pages.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={promptRenamePage}
                      className="rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-neutral-200 transition hover:bg-white/10 disabled:opacity-40"
                      disabled={!currentPageId}
                    >
                      Umbenennen
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className="flex-1 rounded border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-40"
                      disabled={!_projectId || !currentPageId || pages.length <= 1 || deletingPage}
                      onClick={handleDeleteCurrentPage}
                    >
                      {deletingPage ? 'Lösche…' : '- Seite'}
                    </button>
                    <button
                      className="flex-1 rounded border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
                      onClick={async () => {
                        if (!_projectId) return;
                        const idx = pages.length + 1;
                        const id = await createPage(_projectId, `Seite ${idx}`);
                        handlePageSelection(id || null, { placeholderName: `Seite ${idx}` });
                      }}
                    >
                      + Seite
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4" data-tour-id="editor-toolbox">
                  <div className="flex w-full items-center justify-between text-left">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">Elemente</p>
                      <p className="text-sm font-semibold text-white">Bausteine & Vorlagen</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-1 flex-col overflow-hidden">
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                      {[
                        { id: 'components', label: 'Bausteine' },
                        { id: 'quick-buttons', label: 'Fertige Buttons' },
                        { id: 'templates', label: 'Vorlagen' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setToolboxTab(tab.id as 'components' | 'quick-buttons' | 'templates')}
                          className={`rounded-lg border px-3 py-2 transition ${
                            toolboxTab === tab.id
                              ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                              : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex-1 overflow-hidden">
                      {toolboxTab === 'components' && toolboxContent}
                      {toolboxTab === 'quick-buttons' && <QuickButtonsPanel onCreatePage={createQuickPresetPage} />}
                      {toolboxTab === 'templates' && (
                        <div className="h-full overflow-y-auto space-y-3 pr-1">{templateContent}</div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </aside>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-hidden="true"
            className="hidden lg:block w-1.5 cursor-col-resize self-stretch rounded-full bg-white/5 transition-colors hover:bg-emerald-400/40"
            style={{ flexShrink: 0, touchAction: 'none' }}
            onMouseDown={(event) => startPanelDrag('left', event)}
          />

          <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col lg:hidden">
              <div className="sticky top-0 z-20 border-b border-white/10 bg-[#05070f]/95 px-4 py-4 text-white shadow-xl backdrop-blur" data-tour-id="editor-actions">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">Projekt</p>
                    <p className="text-base font-semibold text-white">{project?.name ?? 'Unbenanntes Projekt'}</p>
                    {project?.description && <p className="text-xs text-neutral-400">{project.description}</p>}
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                  >
                    <span className="text-lg">←</span>
                    <span>Dashboard</span>
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <button
                    className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-semibold text-neutral-100 transition hover:bg-white/10 disabled:opacity-40"
                    onClick={() => setExportDialogOpen(true)}
                    disabled={!hasPages}
                  >
                    <span className="text-base">⬇️</span>
                    <span>Export</span>
                  </button>
                  <QRCodeButton
                    projectId={_projectId}
                    pageId={currentPageId}
                    onBeforeOpen={flushPendingSave}
                    className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:bg-white/10"
                  />
                  <button
                    className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-semibold text-neutral-100 transition hover:bg-white/10"
                    onClick={() => {
                      setAiError(null);
                      setAiOpen(true);
                    }}
                  >
                    <span className="text-base">✨</span>
                    <span>KI</span>
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2 text-xs">
                  <select
                    className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3 py-2 text-sm"
                    value={currentPageId ?? ''}
                    onChange={(event) => handlePageSelection(event.target.value || null)}
                  >
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={promptRenamePage}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 font-semibold text-neutral-200 transition hover:bg-white/10 disabled:opacity-40"
                    disabled={!currentPageId}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/10 px-3 font-semibold transition hover:bg-white/20"
                    onClick={async () => {
                      if (!_projectId) return;
                      const idx = pages.length + 1;
                      const id = await createPage(_projectId, `Seite ${idx}`);
                      handlePageSelection(id || null, { placeholderName: `Seite ${idx}` });
                    }}
                  >
                    + Seite
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <button
                    className="flex-1 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3 py-2 font-semibold text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-40"
                    disabled={!_projectId || !currentPageId || pages.length <= 1 || deletingPage}
                    onClick={handleDeleteCurrentPage}
                  >
                    {deletingPage ? 'Lösche…' : '- Seite'}
                  </button>
                  {settingsHref ? (
                    <Link
                      href={settingsHref}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 font-semibold text-xs transition hover:bg-white/20"
                    >
                      ⚙️ Einstellungen
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-semibold text-neutral-400"
                    >
                      ⚙️ Einstellungen
                    </button>
                  )}
                </div>
              </div>

              <div className="relative flex-1 overflow-hidden bg-[#030409]">
                <section
                  className={`absolute inset-0 flex flex-col gap-4 overflow-y-auto px-4 py-4 transition-all duration-200 ease-out ${
                    mobilePanel === 'toolbox' ? 'opacity-100 translate-x-0' : 'pointer-events-none opacity-0 translate-x-6'
                  }`}
                  data-tour-id="editor-toolbox"
                >
                  <div className="rounded-2xl border border-white/10 bg-[#070a13]/90 p-4 shadow-2xl">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">Elemente</p>
                        <p className="text-sm font-semibold text-white">Bausteine & Vorlagen</p>
                      </div>
                      <span className="text-[11px] text-neutral-400">Tippen zum Einfügen</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold">
                      {[
                        { id: 'components', label: 'Bausteine' },
                        { id: 'quick-buttons', label: 'Fertige Buttons' },
                        { id: 'templates', label: 'Vorlagen' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setToolboxTab(tab.id as 'components' | 'quick-buttons' | 'templates')}
                          className={`rounded-lg border px-3 py-2 transition ${
                            toolboxTab === tab.id
                              ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                              : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-3 overflow-y-auto pr-1">
                      {toolboxTab === 'components' && <CategorizedToolbox onAdd={addNode} />}
                      {toolboxTab === 'quick-buttons' && <QuickButtonsPanel onCreatePage={createQuickPresetPage} />}
                      {toolboxTab === 'templates' && templateContent}
                    </div>
                  </div>
                </section>

                <section
                  className={`absolute inset-0 flex flex-col overflow-hidden px-4 py-4 transition-all duration-200 ease-out ${
                    mobilePanel === 'canvas' ? 'opacity-100 translate-x-0' : 'pointer-events-none opacity-0 translate-x-6'
                  }`}
                  data-tour-id="editor-canvas"
                >
                  <div className="mb-3 flex flex-col items-center gap-2">
                    <ZoomControl />
                    <HistoryControls />
                  </div>
                  <div className="flex flex-1 overflow-auto rounded-2xl border border-white/10 bg-[#070a13]/90 p-3 shadow-2xl">
                    <Canvas
                      tree={tree}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onRemove={onRemove}
                      onMove={onMove}
                      onResize={(id: string, patch: Partial<EditorNode>) => updateNode(id, patch)}
                      onUpdateNode={(id: string, patch: Partial<EditorNode>) => updateNode(id, patch)}
                      zoom={canvasZoom}
                    />
                  </div>
                </section>

                <section
                  className={`absolute inset-0 flex flex-col gap-4 overflow-y-auto px-4 py-4 transition-all duration-200 ease-out ${
                    mobilePanel === 'properties' ? 'opacity-100 translate-x-0' : 'pointer-events-none opacity-0 translate-x-6'
                  }`}
                  data-tour-id="editor-properties"
                >
                  <div className="rounded-2xl border border-white/10 bg-[#070a13]/90 p-4 shadow-2xl">
                    <PropertiesPanel
                      node={selectedNode}
                      onUpdate={(patch) => {
                        if (selectedId) updateNode(selectedId, patch);
                      }}
                      pageBackground={pageBackground}
                      pageBackgroundColor={pageBackgroundColor}
                      onChangeBackgroundColor={setPageBackgroundColor}
                      backgroundLayers={backgroundLayers}
                      onChangeBackgroundLayers={setBackgroundLayers}
                      backgroundSyncEnabled={backgroundSyncEnabled}
                      onToggleBackgroundSync={toggleBackgroundSync}
                      onChangeBackground={setPageBackground}
                      onGenerateBackground={generatePageBackground}
                      onResetBackground={resetPageBackground}
                    />
                  </div>
                </section>
              </div>

              <nav className="grid grid-cols-3 border-t border-white/10 bg-[#05070f]/95 text-xs">
                {MOBILE_NAV_ITEMS.map((item) => {
                  const isActive = mobilePanel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`flex flex-col items-center justify-center gap-1 py-2 font-semibold transition ${
                        isActive ? 'text-emerald-200' : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                      onClick={() => setMobilePanel(item.id)}
                      aria-pressed={isActive}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-[11px] uppercase tracking-widest">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="hidden flex-1 min-h-0 flex-col gap-4 overflow-auto p-6 lg:flex">
              <div className="flex items-center justify-between gap-4">
                <HistoryControls />
                <ZoomControl />
              </div>
              <div className="flex flex-1 overflow-auto rounded-2xl border border-white/10 bg-[#070a13]/80 p-4 shadow-2xl" data-tour-id="editor-canvas">
                <Canvas
                  tree={tree}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRemove={onRemove}
                  onMove={onMove}
                  onResize={(id: string, patch: Partial<EditorNode>) => updateNode(id, patch)}
                  onUpdateNode={(id: string, patch: Partial<EditorNode>) => updateNode(id, patch)}
                  zoom={canvasZoom}
                />
              </div>
            </div>
          </main>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-hidden="true"
            className="hidden lg:block w-1.5 cursor-col-resize self-stretch rounded-full bg-white/5 transition-colors hover:bg-emerald-400/40"
            style={{ flexShrink: 0, touchAction: 'none' }}
            onMouseDown={(event) => startPanelDrag('right', event)}
          />

          <aside
            className="hidden flex-shrink-0 flex-col border-l border-[#222] bg-[#0b0b0f]/90 backdrop-blur-sm lg:flex"
            data-tour-id="editor-properties"
            style={{ width: `${rightPanelWidth}px` }}
          >
            <div className="flex-1 overflow-y-auto p-4">
              <PropertiesPanel
                node={selectedNode}
                onUpdate={(patch) => {
                  if (selectedId) updateNode(selectedId, patch);
                }}
                pageBackground={pageBackground}
                pageBackgroundColor={pageBackgroundColor}
                onChangeBackgroundColor={setPageBackgroundColor}
                backgroundLayers={backgroundLayers}
                onChangeBackgroundLayers={setBackgroundLayers}
                backgroundSyncEnabled={backgroundSyncEnabled}
                onToggleBackgroundSync={toggleBackgroundSync}
                onChangeBackground={setPageBackground}
                onGenerateBackground={generatePageBackground}
                onResetBackground={resetPageBackground}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>

      {exportDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur"
          onClick={() => setExportDialogOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Export</p>
              <h3 className="text-2xl font-semibold">Format auswählen</h3>
              <p className="text-sm text-neutral-300">Wähle das gewünschte Exportziel aus. Alle Varianten enthalten eine README mit Setup-Hinweisen.</p>
            </div>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10 disabled:opacity-40"
                onClick={exportJson}
                disabled={!hasPages}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">JSON</p>
                    <p className="text-sm text-neutral-400">Rohdaten aller Seiten (Import/Backup)</p>
                  </div>
                  <span className="text-lg">→</span>
                </div>
              </button>
              <button
                type="button"
                className="w-full rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-4 text-left text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-40"
                onClick={exportWebBundle}
                disabled={!hasPages || exporting === 'web'}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Web (ZIP)</p>
                    <p className="text-sm text-emerald-200/80">Vite/React-Starter mit allen Seiten</p>
                  </div>
                  <span className="text-lg">{exporting === 'web' ? '…' : '→'}</span>
                </div>
              </button>
              <button
                type="button"
                className="w-full rounded-2xl border border-amber-400/40 bg-amber-500/20 p-4 text-left text-amber-100 transition hover:bg-amber-500/30 disabled:opacity-40"
                onClick={exportAndroidKit}
                disabled={!hasPages || exporting === 'apk'}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Android Kit</p>
                    <p className="text-sm text-amber-100/80">Expo/React-Native Projekt inkl. README</p>
                  </div>
                  <span className="text-lg">{exporting === 'apk' ? '…' : '→'}</span>
                </div>
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-2 text-sm">
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-neutral-100 transition hover:bg-white/10"
                onClick={() => setExportDialogOpen(false)}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d101b] p-6 shadow-2xl">
            <div className="space-y-2 pb-4">
              <h2 className="text-xl font-semibold text-neutral-100">KI-Seitengenerator</h2>
              <p className="text-sm text-neutral-400">
                Beschreibe, was wir für dich bauen sollen – egal ob komplette App oder nur die aktuelle Seite.
              </p>
            </div>
            <p className="text-sm text-neutral-300">
              Die KI aktualisiert ausschließlich die aktuell geöffnete Seite. Beschreibe kurz, was angepasst oder ergänzt werden soll – je konkreter du bist, desto besser werden Layout, Texte, Abschnitte oder Call-to-Actions.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(event) => {
                setAiPrompt(event.target.value);
                if (aiError) setAiError(null);
              }}
              placeholder="Beschreibe, was angepasst werden soll …"
              className="h-32 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none"
            />
            {aiError && (
              <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {aiError}
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100"
                onClick={() => (!aiBusy ? setAiOpen(false) : null)}
                disabled={aiBusy}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-60"
                onClick={runAiGenerator}
                disabled={aiBusy}
              >
                {aiBusy ? 'Erstelle…' : 'Seite aktualisieren'}
              </button>
            </div>
          </div>
        </div>
      )}

      <GuidedTour storageKey="tour-editor" steps={editorTourSteps} restartLabel="Editor Tutorial" />
    </>
  );
}

