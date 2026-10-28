import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);

async function load(path, overrides = {}, globals = {}) {
  const { outputText } = ts.transpileModule(await readFile(new URL(path, root), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  });
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(globals), outputText)(
    (name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name),
    loaded, loaded.exports, ...Object.values(globals)
  );
  return loaded.exports;
}

async function fixture(saved) {
  const store = new Map();
  const events = new EventTarget();
  const window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  };
  const document = { cookie: '' };
  const consent = await load('src/lib/privacy-consent.ts', {}, { window, document });
  if (saved !== undefined) store.set(consent.PRIVACY_CONSENT_STORAGE_KEY, saved);
  return { consent, window, document, store };
}

test('consent helper is inert during server rendering', async () => {
  const consent = await load('src/lib/privacy-consent.ts', {}, { window: undefined });
  assert.equal(consent.readPrivacyConsent(), null);
  consent.writePrivacyConsent(consent.buildPrivacyConsent(true));
  consent.openPrivacySettings();
  consent.dispatchPrivacyConsentChanged(consent.buildPrivacyConsent(false));
});

test('current acceptance and rejection persist with version, time and a 180-day cookie', async () => {
  const { consent, document } = await fixture();
  for (const analytics of [true, false]) {
    const choice = consent.buildPrivacyConsent(analytics);
    consent.writePrivacyConsent(choice);
    assert.deepEqual(consent.readPrivacyConsent(), choice);
    assert.equal(choice.essential, true);
    assert.equal(choice.version, consent.PRIVACY_CONSENT_VERSION);
    assert.match(document.cookie, /Max-Age=15552000; SameSite=Lax/);
  }
});

test('old combined choices, expired, malformed and future choices require renewed selection', async () => {
  const { consent, store } = await fixture();
  const now = Date.now();
  const current = consent.buildPrivacyConsent(true);
  const invalid = [
    'broken json', 'null', '{}',
    JSON.stringify({ ...current, analytics: 'true' }),
    ...[true, false].map((analytics) => JSON.stringify({ ...current, analytics, version: '2026-03-08' })),
    JSON.stringify({ ...current, updatedAt: new Date(now - 181 * 86400000).toISOString() }),
    JSON.stringify({ ...current, updatedAt: new Date(now + 86400000).toISOString() }),
    JSON.stringify({ ...current, updatedAt: 'invalid' }),
  ];
  assert.equal(consent.readPrivacyConsent(), null);
  for (const value of invalid) {
    store.set(consent.PRIVACY_CONSENT_STORAGE_KEY, value);
    assert.equal(consent.readPrivacyConsent(), null, value);
  }
});

test('settings can reopen and changes broadcast the current accepted or withdrawn choice', async () => {
  const { consent, window } = await fixture();
  let opened = 0;
  const choices = [];
  window.addEventListener(consent.PRIVACY_SETTINGS_EVENT, () => opened++);
  window.addEventListener(consent.PRIVACY_CONSENT_CHANGED_EVENT, (event) => choices.push(event.detail.analytics));
  consent.openPrivacySettings();
  for (const enabled of [true, false]) {
    const choice = consent.buildPrivacyConsent(enabled);
    consent.writePrivacyConsent(choice);
    consent.dispatchPrivacyConsentChanged(choice);
  }
  assert.equal(opened, 1);
  assert.deepEqual(choices, [true, false]);
  assert.equal(consent.readPrivacyConsent().analytics, false);
});

async function bannerFixture(saved) {
  const browser = await fixture(saved);
  const states = [];
  const effects = [];
  let cursor = 0;
  let effectCursor = 0;
  let pending = [];
  const react = {
    ...require('react'),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (next) => { states[index] = next; }];
    },
    useEffect(callback, deps) {
      const index = effectCursor++;
      if (!effects[index] || deps.some((value, i) => value !== effects[index][i])) {
        effects[index] = deps;
        pending.push(callback);
      }
    },
  };
  const { default: Banner } = await load('src/components/ConsentBanner.tsx', {
    react, '@/lib/privacy-consent': browser.consent,
  }, { window: browser.window });
  return {
    ...browser,
    render() {
      cursor = effectCursor = 0;
      pending = [];
      const nodes = [];
      function visit(node) {
        if (Array.isArray(node)) return node.forEach(visit);
        if (!node?.props) return;
        if (typeof node.type === 'function') return visit(node.type(node.props));
        if (typeof node.type === 'string') nodes.push(node);
        visit(node.props.children);
      }
      visit(Banner());
      pending.forEach((effect) => effect());
      return nodes;
    },
  };
}

function click(nodes, label) {
  const button = nodes.find((node) => node.type === 'button' && node.props.children === label);
  assert.ok(button, label);
  button.props.onClick();
}

test('banner preserves design, exact analysis copy, push notice and all dialog controls', async () => {
  const fixture = await bannerFixture();
  fixture.render();
  click(fixture.render(), 'Einstellungen');
  const nodes = fixture.render();
  assert.ok(nodes.some((node) => node.type === 'h3' && node.props.children === 'Essenziell'));
  assert.ok(nodes.some((node) => node.type === 'h3' && node.props.children === 'Analyse'));
  const copy = nodes.filter((node) => node.type === 'p').map((node) => node.props.children);
  assert.ok(copy.includes('Mit Ihrer Einwilligung nutzen wir Firebase Analytics, um die Nutzung unserer Plattform besser zu verstehen und die AppSchmiede kontinuierlich zu verbessern. Dabei können Cookies oder vergleichbare Technologien eingesetzt und Nutzungsdaten verarbeitet werden.'));
  assert.ok(nodes.some((node) => node.props.className?.includes('bg-[#090d16]')));
  const bannerSource = await readFile(new URL('src/components/ConsentBanner.tsx', root), 'utf8');
  assert.match(bannerSource, /Firebase-Push-Benachrichtigungen sind derzeit nicht eingebunden/);
  assert.match(bannerSource, /Firebase Analytics ist derzeit nicht aktiviert/);
  const checkbox = nodes.find((node) => node.type === 'input');
  assert.equal(checkbox.props.checked, false);
  assert.equal(checkbox.props['aria-label'], 'Analyse aktivieren');
  checkbox.props.onChange({ target: { checked: true } });
  click(fixture.render(), 'Auswahl speichern');
  assert.equal(fixture.consent.readPrivacyConsent().analytics, true);
});

test('accept, reopen, reject and reload respect the stored choice without loading a service', async () => {
  const fixture = await bannerFixture();
  fixture.render();
  click(fixture.render(), 'Alle akzeptieren');
  assert.equal(fixture.consent.readPrivacyConsent().analytics, true);
  assert.equal(fixture.render().length, 0);
  fixture.consent.openPrivacySettings();
  let nodes = fixture.render();
  assert.equal(nodes.find((node) => node.type === 'input').props.checked, true);
  click(nodes, 'Alle ablehnen');
  assert.equal(fixture.consent.readPrivacyConsent().analytics, false);
  const rejectedReload = await bannerFixture(JSON.stringify(fixture.consent.readPrivacyConsent()));
  rejectedReload.render();
  assert.equal(rejectedReload.render().length, 0);
  rejectedReload.consent.openPrivacySettings();
  assert.equal(rejectedReload.render().find((node) => node.type === 'input').props.checked, false);
  fixture.consent.openPrivacySettings();
  nodes = fixture.render();
  assert.equal(nodes.find((node) => node.type === 'input').props.checked, false);
  click(nodes, 'Alle akzeptieren');
  assert.equal(fixture.consent.readPrivacyConsent().analytics, true);
  const reload = await bannerFixture(JSON.stringify(fixture.consent.readPrivacyConsent()));
  reload.render();
  assert.equal(reload.render().length, 0);
});

test('a saved combined choice reopens the initial banner instead of implying new consent', async () => {
  const fixture = await bannerFixture(JSON.stringify({
    essential: true, analytics: true, version: '2026-03-08', updatedAt: new Date().toISOString(),
  }));
  fixture.render();
  const nodes = fixture.render();
  assert.ok(nodes.some((node) => node.type === 'button' && node.props.children === 'Einstellungen'));
  click(nodes, 'Einstellungen');
  assert.equal(fixture.render().find((node) => node.type === 'input').props.checked, false);
});

test('application sources, legal copy, public assets and example configuration contain no advertising integration', async () => {
  const paths = ['.env.example', 'next.config.ts', 'package.json'];
  async function collect(directory) {
    for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await collect(path);
      else if (/\.(tsx?|jsx?|json|html|txt|xml|md)$/.test(path)) paths.push(path);
    }
  }
  await collect('src');
  if (existsSync(new URL('public', root))) await collect('public');
  for (const path of paths) {
    assert.doesNotMatch(await readFile(new URL(path, root), 'utf8'),
      /adsense|adsbygoogle|ca-pub-|googlesyndication|doubleclick|GoogleAdSlot|data-ad-slot|Analyse und Werbung/i, path);
  }
  for (const name of ['AdSenseLoader', 'GoogleAdSlot']) {
    assert.equal(existsSync(new URL(`src/components/${name}.tsx`, root)), false);
  }
  const firebase = await readFile(new URL('src/lib/firebase.ts', root), 'utf8');
  assert.doesNotMatch(firebase, /firebase\/analytics|getAnalytics|initializeAnalytics/);
  for (const service of ['firebase/auth', 'firebase/firestore', 'firebase/storage']) assert.ok(firebase.includes(service));
});
