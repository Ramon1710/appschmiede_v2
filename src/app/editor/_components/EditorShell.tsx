'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CategorizedToolbox from './CategorizedToolbox';
import QRCodeButton from '../_extensions/QRCodeButton';
import Header from '@/components/Header';
import type { PageTree, Node as EditorNode, NodeType, NodeProps } from '@/lib/editorTypes';
import { savePage, subscribePages, createPage, deletePage, renamePage } from '@/lib/db-editor';
import useAuth from '@/hooks/useAuth';
import type { Project } from '@/lib/db-projects';
import { subscribeProjects } from '@/lib/db-projects';
import JSZip from 'jszip';

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
];

const LAST_PROJECT_KEY = 'appschmiede:last-project';

export default function EditorShell({ initialPageId }: Props) {
  const searchParams = useSearchParams();
  const routeParams = useParams<{ projectId?: string; pageId?: string }>();
  const [tree, setTree] = useState<PageTree>(() => sanitizePage(emptyTree));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);
  const latestTree = useRef<PageTree>(sanitizePage(emptyTree));
  const pendingSyncHash = useRef<string | null>(null);
  const { user, loading } = useAuth();

  // Unterstütze sowohl ?projectId= als auch ?id=
  const [storedProjectId, setStoredProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LAST_PROJECT_KEY);
    if (saved) {
      setStoredProjectId(saved);
    }
  }, []);

  const queryProjectId = searchParams.get('projectId') ?? searchParams.get('id');
  const paramsProjectId = typeof routeParams?.projectId === 'string' ? routeParams.projectId : null;
  const [manualProjectId, setManualProjectId] = useState<string | null>(null);
  const derivedProjectId = queryProjectId ?? paramsProjectId ?? storedProjectId ?? null;
  const _projectId = manualProjectId ?? derivedProjectId ?? null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!_projectId) return;
    window.localStorage.setItem(LAST_PROJECT_KEY, _projectId);
    if (storedProjectId !== _projectId) {
      setStoredProjectId(_projectId);
    }
  }, [_projectId, storedProjectId]);

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
  
  const [toolboxOpen, setToolboxOpen] = useState(true);
  const [toolboxTab, setToolboxTab] = useState<'components' | 'templates'>('components');
  const [mobilePanel, setMobilePanel] = useState<'toolbox' | 'canvas' | 'properties'>('canvas');
  const [templateSelectValue, setTemplateSelectValue] = useState('');
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);

  useEffect(() => {
    if (_projectId && currentPageId) {
      setTemplateNotice(null);
    }
  }, [_projectId, currentPageId]);

  const downloadAnchor = useRef<HTMLAnchorElement | null>(null);
  const [exporting, setExporting] = useState<'web' | 'apk' | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const hasPages = pages.length > 0;

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
    (updater: (prev: PageTree) => PageTree, options?: { markDirty?: boolean }): PageTree => {
      let nextState: PageTree | undefined;
      setTree((prev) => {
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
    []
  );

  const setProjectId = useCallback(
    (nextId: string | null) => {
      setManualProjectId(nextId);
      setCurrentPageId(null);
      setPages([]);
      setSelectedId(null);
      setTemplateSelectValue('');
      setTemplateNotice(null);
      applyTreeUpdate(() => sanitizePage(emptyTree), { markDirty: false });
      pendingSyncHash.current = null;
      isDirty.current = false;
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (nextId) {
          url.searchParams.set('id', nextId);
        } else {
          url.searchParams.delete('id');
        }
        url.searchParams.delete('p');
        url.searchParams.delete('pageId');
        window.history.replaceState(null, '', url.toString());
      }
    },
    [applyTreeUpdate, setCurrentPageId, setManualProjectId, setPages, setSelectedId, setTemplateNotice, setTemplateSelectValue]
  );

  const openTemplatesWindow = useCallback(() => {
    const url = '/tools/templates';
    if (typeof window === 'undefined') return;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = url;
    }
  }, []);

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
        children: (prev.tree.children ?? []).map((n) =>
          n.id === id ? { ...n, x: (n.x ?? 0) + dx, y: (n.y ?? 0) + dy } : n
        ),
      },
    }));
  }, [applyTreeUpdate]);

  const selectedNode = useMemo(
    () => (tree.tree.children ?? []).find((n) => n.id === selectedId) ?? null,
    [tree, selectedId]
  );

  const currentPageMeta = useMemo(() => pages.find((p) => p.id === currentPageId) ?? null, [pages, currentPageId]);

  const settingsHref = useMemo(() => (_projectId ? `/editor/settings?projectId=${_projectId}` : null), [_projectId]);

  const pageBackground = useMemo(() => {
    const raw = tree.tree.props?.bg;
    return typeof raw === 'string' && raw.trim() ? raw : DEFAULT_PAGE_BACKGROUND;
  }, [tree]);

  const setPageBackground = useCallback((value: string) => {
    const next = typeof value === 'string' && value.trim() ? value : DEFAULT_PAGE_BACKGROUND;
    applyTreeUpdate((prev) => ({
      ...prev,
      tree: {
        ...prev.tree,
        props: { ...(prev.tree.props ?? {}), bg: next },
      },
    }));
  }, [applyTreeUpdate]);

  const generatePageBackground = useCallback((description: string) => {
    const colors = ['#38BDF8', '#6366F1', '#F472B6', '#22D3EE', '#F97316', '#A855F7'];
    const hash = [...description].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const first = colors[hash % colors.length];
    const second = colors[(hash + 3) % colors.length];
    const third = colors[(hash + 5) % colors.length];
    const gradient = `linear-gradient(140deg, ${first}, ${second}, ${third})`;
    setPageBackground(gradient);
  }, [setPageBackground]);

  const resetPageBackground = useCallback(() => {
    setPageBackground(DEFAULT_PAGE_BACKGROUND);
  }, [setPageBackground]);

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
            return {
              ...n,
              ...patch,
              props: nextProps,
              style: nextStyle,
            };
          }),
        },
      }));
    },
    [applyTreeUpdate]
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
      id: crypto.randomUUID(),
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

    if (!nextTree) return false;

    setPages((prev) => {
      const existing = prev.find((page) => page.id === currentPageId) ?? null;
      const updatedPage: PageTree = existing
        ? { ...existing, tree: nextTree.tree }
        : {
            id: currentPageId,
            name: nextTree.name,
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
  }, [_projectId, currentPageId, applyTreeUpdate, setPages, setTemplateNotice, currentPageMeta, tree.name]);

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
      id: crypto.randomUUID(),
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
  }, [_projectId, currentPageId, applyTreeUpdate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedId) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.closest('input, textarea') || target.contentEditable === 'true')) {
        return;
      }
      event.preventDefault();
      onRemove(selectedId);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onRemove]);

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
      const data = (await response.json()) as { page?: PageTree };
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
      pendingSyncHash.current = hashPage(updatedTree);
      isDirty.current = false;

      setAiPrompt('');
      setAiOpen(false);
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

  const handlePageSelection = useCallback((id: string | null) => {
    setCurrentPageId(id);
    const sel = pages.find((p) => p.id === id);
    if (sel) {
      applyTreeUpdate(() => sel, { markDirty: false });
      pendingSyncHash.current = null;
      isDirty.current = false;
    }
  }, [pages, applyTreeUpdate]);

  const templateControlsDisabled = !_projectId || !currentPageId;

  const templateContent = (
    <>
      <p className="text-xs text-neutral-400">
        Ersetzt die aktuell geöffnete Seite mit einer kuratierten Vorlage.
      </p>
      <div className="mt-3 space-y-2">
        <label className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Dropdown Auswahl</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-400 focus:outline-none disabled:opacity-40"
            value={templateSelectValue}
            disabled={templateControlsDisabled}
            onChange={(event) => {
              setTemplateSelectValue(event.target.value);
              if (event.target.value) {
                setTemplateNotice(null);
              }
            }}
          >
            <option value="">Vorlage wählen…</option>
            {APP_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.template}>{tpl.title}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={templateControlsDisabled}
            onClick={() => {
              if (!templateSelectValue) {
                setTemplateNotice('Bitte wähle eine Vorlage aus.');
                return;
              }
              const applied = applyTemplate(templateSelectValue);
              if (applied) {
                setTemplateSelectValue('');
                setTemplateNotice(null);
              }
            }}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              templateControlsDisabled
                ? 'cursor-not-allowed border-white/10 bg-white/5 text-neutral-500'
                : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
            }`}
          >
            Dropdown anwenden
          </button>
        </div>
        {templateNotice && (
          <p className="text-xs text-rose-300">{templateNotice}</p>
        )}
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {APP_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            disabled={templateControlsDisabled}
            onClick={() => {
              if (templateControlsDisabled) {
                setTemplateNotice('Bitte öffne oder lade ein Projekt, bevor du Vorlagen nutzt.');
                return;
              }
              const applied = applyTemplate(tpl.template);
              if (applied) {
                setTemplateSelectValue('');
                setTemplateNotice(null);
              }
            }}
            className={`group relative min-w-[13rem] rounded-2xl border px-4 py-3 text-left transition ${
              templateControlsDisabled
                ? 'cursor-not-allowed border-white/5 bg-white/5 text-neutral-500'
                : 'border-white/10 bg-white/5 hover:border-emerald-400/50 hover:bg-white/10'
            }`}
          >
            <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${tpl.gradient} px-3 py-1 text-[11px] font-semibold text-white`}>
              <span>{tpl.icon}</span>
              <span>{tpl.subtitle}</span>
            </div>
            <div className="mt-3 text-lg font-semibold text-white">{tpl.title}</div>
            <p className="text-sm text-neutral-300">{tpl.description}</p>
            <span className="mt-2 inline-flex items-center text-[11px] font-semibold text-emerald-300">
              Vorlage anwenden
              <span className="ml-1 transition group-hover:translate-x-1">→</span>
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={openTemplatesWindow}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:bg-white/10"
      >
        Mehr Vorlagen im eigenen Fenster öffnen
      </button>
    </>
  );

  const toolboxContent = (
    <div className="max-h-[440px] overflow-y-auto pr-1">
      <CategorizedToolbox onAdd={addNode} />
    </div>
  );

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
      <div className="flex min-h-screen flex-col bg-[#05070e] text-white">
        <Header />
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Editor</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Bitte anmelden</h1>
            <p className="text-base text-neutral-200">
              Der Editor steht nur angemeldeten Accounts zur Verfügung. Melde dich an, um deine Projekte zu laden oder neue Apps zu erstellen.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-400"
            >
              Zum Login
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white/90 hover:bg-white/10"
            >
              Noch kein Konto? Registrieren
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col bg-[#05070e]">
        <Header />
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          <aside className="hidden w-[24rem] flex-shrink-0 flex-col border-r border-[#222] bg-[#05070e]/70 backdrop-blur-sm lg:flex">
            <div className="flex h-full flex-col">
              <div className="border-b border-[#111]/60 bg-[#0b0b0f]/95 px-4 py-4">
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
                    className="flex-1 min-w-[9rem] rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-40"
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
                    className="flex-1 min-w-[9rem] rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
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
                  <div className="mt-2 text-sm font-semibold text-neutral-50">{project?.name ?? 'Projekt wählen'}</div>
                  <p className="text-xs text-neutral-400">{project?.description ?? 'Keine Beschreibung'}</p>
                  <div className="mt-3">
                    <select
                      className="w-full rounded-xl border border-[#333] bg-neutral-900 px-3 py-2 text-sm"
                      value={_projectId ?? ''}
                      onChange={(event) => setProjectId(event.target.value || null)}
                    >
                      <option value="">Projekt auswählen</option>
                      {projects.map((projectOption) => (
                        <option key={projectOption.id ?? 'none'} value={projectOption.id ?? ''}>
                          {projectOption.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {pages.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      <select
                        className="w-full rounded-xl border border-[#333] bg-neutral-900 px-3 py-2 text-sm"
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
                        className="rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-neutral-200 transition hover:bg-white/10"
                        disabled={!currentPageId}
                      >
                        Umbenennen
                      </button>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className="flex-1 rounded border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-40"
                      disabled={!_projectId || !currentPageId || pages.length <= 1}
                      onClick={async () => {
                        if (!(_projectId && currentPageId) || pages.length <= 1) return;
                        const confirmed = window.confirm('Seite wirklich löschen?');
                        if (!confirmed) return;
                        try {
                          await deletePage(_projectId, currentPageId);
                          setSelectedId(null);
                          setCurrentPageId(null);
                          pendingSyncHash.current = null;
                          isDirty.current = false;
                        } catch (err) {
                          console.error('Seite konnte nicht gelöscht werden', err);
                        }
                      }}
                    >
                      - Seite
                    </button>
                    <button
                      className="flex-1 rounded border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
                      onClick={async () => {
                        if (!_projectId) return;
                        const idx = pages.length + 1;
                        const id = await createPage(_projectId, `Seite ${idx}`);
                        handlePageSelection(id ?? null);
                      }}
                    >
                      + Seite
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <button
                      type="button"
                      onClick={() => setToolboxOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between text-left"
                    >
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
                    </>
                  );
                      </div>
                      <span className="text-xl text-neutral-400">{toolboxOpen ? '−' : '+'}</span>
                    </button>
                    {toolboxOpen && (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                          {[
                            { id: 'components', label: 'Bausteine' },
                            { id: 'templates', label: 'Vorlagen' },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setToolboxTab(tab.id as 'components' | 'templates')}
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
                        <div>
                          {toolboxTab === 'components' && <div>{toolboxContent}</div>}
                          {toolboxTab === 'templates' && <div className="space-y-3">{templateContent}</div>}
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="border-b border-[#111] bg-[#0b0b0f]/95 px-4 py-3 shadow-inner lg:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                >
                  <span className="text-lg">←</span>
                  <span>Dashboard</span>
                </Link>
                <button
                  className="rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-40"
                  onClick={() => setExportDialogOpen(true)}
                  disabled={!hasPages}
                >
                  Export
                </button>
                <QRCodeButton
                  projectId={_projectId}
                  pageId={currentPageId}
                  onBeforeOpen={flushPendingSave}
                  className="rounded"
                />
                <button
                  className="rounded border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
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
                    className="inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
                  >
                    ⚙️ Einstellungen
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-400"
                  >
                    ⚙️ Einstellungen
                  </button>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <select
                  className="w-full rounded border border-[#333] bg-neutral-900 px-3 py-2 text-sm"
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
                  className="rounded border border-white/15 bg-white/5 px-3 text-xs font-semibold text-neutral-200"
                  disabled={!currentPageId}
                >
                  ✏️
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="flex-1 rounded border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/30 disabled:opacity-40"
                  disabled={!_projectId || !currentPageId || pages.length <= 1}
                  onClick={async () => {
                    if (!(_projectId && currentPageId) || pages.length <= 1) return;
                    const confirmed = window.confirm('Seite wirklich löschen?');
                    if (!confirmed) return;
                    try {
                      await deletePage(_projectId, currentPageId);
                      setSelectedId(null);
                      setCurrentPageId(null);
                      pendingSyncHash.current = null;
                      isDirty.current = false;
                    } catch (err) {
                      console.error('Seite konnte nicht gelöscht werden', err);
                    }
                  }}
                >
                  - Seite
                </button>
                <button
                  className="flex-1 rounded border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
                  onClick={async () => {
                    if (!_projectId) return;
                    const idx = pages.length + 1;
                    const id = await createPage(_projectId, `Seite ${idx}`);
                    handlePageSelection(id ?? null);
                  }}
                >
                  + Seite
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 font-medium transition ${
                    mobilePanel === 'toolbox'
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                  onClick={() => setMobilePanel('toolbox')}
                >
                  Werkzeuge
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 font-medium transition ${
                    mobilePanel === 'canvas'
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                  onClick={() => setMobilePanel('canvas')}
                >
                  Website Vorschau
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 font-medium transition ${
                    mobilePanel === 'properties'
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                  onClick={() => setMobilePanel('properties')}
                >
                  Eigenschaften
                </button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              {mobilePanel === 'toolbox' && (
                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 lg:hidden">
                  <div className="rounded-2xl border border-white/10 bg-[#070a13]/80 p-4 shadow-2xl">
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      {[
                        { id: 'components', label: 'Bausteine' },
                        { id: 'templates', label: 'Vorlagen' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setToolboxTab(tab.id as 'components' | 'templates')}
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
                    <div className="mt-4 space-y-3">
                      {toolboxTab === 'components' && <CategorizedToolbox onAdd={addNode} />}
                      {toolboxTab === 'templates' && templateContent}
                    </div>
                  </div>
                </div>
              )}
              {mobilePanel === 'canvas' && (
                <div className="flex flex-1 min-h-0 flex-col overflow-auto px-4 py-4 lg:hidden">
                  <div className="flex flex-1 overflow-auto rounded-2xl border border-white/10 bg-[#070a13]/80 p-3 shadow-2xl">
                    <Canvas
                      tree={tree}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onRemove={onRemove}
                      onMove={onMove}
                      onResize={(id: string, patch: Partial<EditorNode>) => updateNode(id, patch)}
                      onUpdateNode={(id: string, patch: Partial<EditorNode>) => updateNode(id, patch)}
                    />
                  </div>
                </div>
              )}
              {mobilePanel === 'properties' && (
                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 lg:hidden">
                  <div className="rounded-2xl border border-white/10 bg-[#070a13]/80 p-4 shadow-2xl">
                    <PropertiesPanel
                      node={selectedNode}
                      onUpdate={(patch) => {
                        if (selectedId) updateNode(selectedId, patch);
                      }}
                      pageBackground={pageBackground}
                      onChangeBackground={setPageBackground}
                      onGenerateBackground={generatePageBackground}
                      onResetBackground={resetPageBackground}
                    />
                  </div>
                </div>
              )}

              <div className="hidden flex-1 min-h-0 overflow-auto p-6 lg:flex">
                <div className="flex flex-1 overflow-auto rounded-2xl border border-white/10 bg-[#070a13]/80 p-4 shadow-2xl">
                  <Canvas
                    tree={tree}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onRemove={onRemove}
                    onMove={onMove}
                    onResize={(id: string, patch: Partial<EditorNode>) => updateNode(id, patch)}
                    onUpdateNode={(id: string, patch: Partial<EditorNode>) => updateNode(id, patch)}
                  />
                </div>
              </div>
            </div>
          </main>

          <aside className="hidden w-[22rem] flex-shrink-0 flex-col border-l border-[#222] bg-[#0b0b0f]/90 backdrop-blur-sm lg:flex">
            <div className="flex-1 overflow-y-auto p-4">
              <PropertiesPanel
                node={selectedNode}
                onUpdate={(patch) => {
                  if (selectedId) updateNode(selectedId, patch);
                }}
                pageBackground={pageBackground}
                onChangeBackground={setPageBackground}
                onGenerateBackground={generatePageBackground}
                onResetBackground={resetPageBackground}
              />
            </div>
          </aside>
        </div>
      </div>

      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d101b] p-6 shadow-2xl">
            <div className="space-y-2 pb-4">
              <h2 className="text-xl font-semibold text-neutral-100">KI-Seitengenerator</h2>
              <p className="text-sm text-neutral-400">
                Beschreibe, was angepasst werden soll – egal ob komplette App oder nur die aktuelle Seite.
              </p>
            </div>
            <p className="text-sm text-neutral-300">
              Die KI aktualisiert ausschließlich die aktuell geöffnete Seite. Beschreibe kurz, was angepasst oder ergänzt werden soll – Layout, Texte, Abschnitte oder Call-to-Actions.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(event) => {
                setAiPrompt(event.target.value);
                if (aiError) setAiError(null);
              }}
              placeholder="Was soll erstellt werden?"
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
    </div>
  );
}

