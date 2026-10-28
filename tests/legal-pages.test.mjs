import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function loadModule(path, overrides = {}) {
  const { outputText } = ts.transpileModule(await source(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(
    (name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name),
    loadedModule,
    loadedModule.exports
  );
  return loadedModule.exports;
}

const shell = await loadModule('src/components/LegalPageShell.tsx');
const privacyButton = {
  __esModule: true,
  default: ({ children, ...props }) => createElement('button', { type: 'button', ...props }, children),
};
const legalOverrides = {
  '@/components/LegalPageShell': shell,
  '@/components/PrivacySettingsButton': privacyButton,
};
const legalPages = [
  ['datenschutz', 14],
  ['agb', 12],
  ['datenschutz/firebase', 11],
];
const oldOperator = /Einzelunternehmer|Beethovenstraße|Westoverledingen|ramon\.meyer@hotmail\.de/;

for (const [route, count] of legalPages) {
  test(`/${route} renders the association, complete sequential headings and current date`, async () => {
    const page = await loadModule(`src/app/${route}/page.tsx`, legalOverrides);
    const html = renderToStaticMarkup(createElement(page.default));
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    for (const value of [
      'Headbang Handwerk e. V.', 'Wiesengrund 5', '26203 Wardenburg',
      'Daniel Bigl', 'Ramon Meyer', 'Melanie Stephan', '28.10.2026',
    ]) assert.ok(text.includes(value), `Missing ${value}`);
    assert.doesNotMatch(text, oldOperator);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    const headings = [...html.matchAll(/<h2>(\d+)\./g)].map((match) => Number(match[1]));
    assert.deepEqual(headings, Array.from({ length: count }, (_, index) => index + 1));
    assert.match(html, /href="mailto:info@headbang-handwerk.de"/);
    assert.match(html, /bg-\[#08111f\]\/90/);
    assert.match(html, /break-words/);
    assert.match(html, /sm:p-8/);
    assert.doesNotMatch(text, /Anfang 2027|bis 2027|Zahlungsrückstände|Checkout-Bedingungen/);
  });

  test(`/${route} has valid local destinations and safely linked external resources`, async () => {
    const page = await loadModule(`src/app/${route}/page.tsx`, legalOverrides);
    const html = renderToStaticMarkup(createElement(page.default));
    for (const match of html.matchAll(/<a\b([^>]+)>/g)) {
      const attributes = match[1];
      const href = attributes.match(/href="([^"]+)"/)?.[1];
      assert.ok(href);
      if (href.startsWith('/')) {
        assert.ok(existsSync(new URL(`../src/app${href}/page.tsx`, import.meta.url)), href);
      } else if (href.startsWith('https://')) {
        assert.match(attributes, /target="_blank"/);
        assert.match(attributes, /rel="noopener noreferrer"/);
        assert.ok(new URL(href).hostname);
      } else {
        assert.match(href, /^mailto:/);
      }
    }
    assert.doesNotMatch(html, /href="\/stripe-subscriptions"/);
  });
}

test('privacy texts disclose actual services, incomplete deletion and unresolved consent issues', async () => {
  const privacy = await source('src/app/datenschutz/page.tsx');
  for (const word of [
    'Vercel', 'Firebase Authentication', 'Cloud Firestore', 'Firebase Storage', 'SMTP',
    'OpenAI', 'Pollinations', 'api.qrserver.com',
    'Google Maps', 'YouTube', 'images.unsplash.com', 'placehold.co',
    'Art. 28 DSGVO', 'Art. 44 ff. DSGVO', 'TDDDG', '180 Tagen', 'fünf Tage',
    'nicht automatisch kaskadierend', 'nicht zuverlässig entfernt', 'Versionsstand',
    'Zero-Data-Retention', 'vor rechtlicher Freigabe',
  ]) assert.ok(privacy.includes(word), word);
  assert.match(privacy, /Firebase Cloud Messaging ist derzeit nicht initialisiert/);
  assert.match(privacy, /Google-Analytics-Tracking sind im untersuchten Anwendungscode nicht initialisiert/);
  assert.match(privacy, /Datenübertragbarkeit/);
  assert.match(privacy, /Landesbeauftragte für den Datenschutz Niedersachsen/);
  assert.match(privacy, /poststelle@lfd\.niedersachsen\.de/);
  const firebase = await source('src/app/datenschutz/firebase/page.tsx');
  assert.match(firebase, /kein vollständiger automatischer Löschplan/);
  assert.match(firebase, /keine Passwörter/);
});

test('terms describe free invited access, preserve rights and contain no paid contract clauses', async () => {
  const terms = await source('src/app/agb/page.tsx');
  for (const value of [
    'für freigeschaltete Mitglieder und Partner kostenlos',
    'keine nutzerseitige Coin-Abrechnung', 'keine kostenpflichtigen App-Tarife',
    'keine automatischen kostenpflichtigen Abonnementverlängerungen',
    'Projektverwaltung', 'visuellen App-Editor', 'Vorlagen', 'Exportfunktionen',
    'KI-Ergebnisse können', 'Verletzung von Leben, Körper oder Gesundheit',
    'Rechte an selbst eingebrachten Projekten', 'bestätigte Löschfunktion',
    'rechtswirksame Annahme', 'wirksame Einbeziehung',
  ]) assert.ok(terms.includes(value), value);
  assert.doesNotMatch(terms, /Preise und Zahlung|Stripe-Subscriptions|Zahlungsrückstände|Checkout|Anfang 2027/);
});

test('shared footer retains precisely the required legal destinations and association link', async () => {
  const { default: Footer } = await loadModule('src/components/SiteFooter.tsx', {
    '@/components/PrivacySettingsButton': privacyButton,
  });
  const html = renderToStaticMarkup(createElement(Footer));
  const internal = [...html.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);
  assert.deepEqual(internal, ['/impressum', '/datenschutz', '/agb', '/datenschutz/firebase']);
  assert.match(html, /href="https:\/\/www.headbang-handwerk.com\/"/);
  assert.match(html, /Datenschutzeinstellungen/);
  assert.doesNotMatch(html, /Stripe-Subscriptions|stripe-subscriptions/);
  assert.match(html, /sm:flex-row/);
  assert.match(html, /lg:flex-row/);
  assert.match(await source('src/app/layout.tsx'), /<SiteFooter \/>/);
});

for (const lang of ['de', 'en']) {
  test(`public pricing URL explains free access without purchase actions (${lang})`, async () => {
    const page = await loadModule('src/app/pricing/page.tsx', {
      'next/headers': { cookies: async () => ({ get: () => ({ value: lang }) }) },
      '@/components/Header': { __esModule: true, default: () => null },
    });
    const html = renderToStaticMarkup(await page.default());
    assert.match(html, lang === 'de' ? /vollständig kostenlos/ : /completely free of charge/);
    assert.match(html, lang === 'de' ? /persönliche Einladung/ : /personal invitation only/);
    assert.doesNotMatch(html, /Spar Abo|Standard Abo|Premium Abo|In Planung|In planning|\/tools\/billing|\/stripe/);
  });
}

test('old subscriptions URL is an unindexed historical notice rather than current payment terms', async () => {
  const page = await loadModule('src/app/stripe-subscriptions/page.tsx', legalOverrides);
  const html = renderToStaticMarkup(createElement(page.default));
  assert.equal(page.metadata.robots.index, false);
  assert.match(html, /kein Vertragsarchiv/);
  assert.match(html, /kündigt keine externen Verträge/);
  assert.doesNotMatch(html, oldOperator);
  assert.doesNotMatch(await source('src/app/sitemap.ts'), /stripe-subscriptions/);
});

test('consent texts no longer claim active Firebase Analytics or Firebase push services', async () => {
  const banner = await source('src/components/ConsentBanner.tsx');
  assert.doesNotMatch(banner, /wie Firebase Analytics|Push-Benachrichtigungen werden nicht über/);
  assert.match(banner, /Firebase Analytics ist derzeit nicht aktiviert/);
  assert.match(banner, /Fremdskripte und Fremdcookies nicht automatisch/);
  assert.match(banner, /href="\/datenschutz"/);
});

test('new checkout remains blocked without contacting Stripe and auth/session enforcement is preserved', async () => {
  const checkout = await loadModule('src/app/api/stripe/checkout/route.ts', {
    '@/lib/stripe': { getStripe: () => assert.fail('No Stripe call is allowed') },
    '@/config/billing': { TEMP_FREE_ACCESS_ENABLED: true },
    '@/lib/firebase-admin': {},
    '@/lib/server-auth': {},
  });
  assert.equal((await checkout.POST(new Request('http://localhost/api/stripe/checkout'))).status, 403);

  const session = await loadModule('src/app/api/auth/session/route.ts', {
    '@/lib/server-auth': {
      APP_SESSION_COOKIE: '__session',
      requireAuthenticatedUid: async () => { throw new Error('not authorized'); },
      isRequestAuthError: () => true,
      createAppSessionCookie: () => assert.fail('Unauthorized account cannot obtain a cookie'),
    },
  });
  assert.equal((await session.POST(new Request('http://localhost/api/auth/session'))).status, 403);
  assert.match((await session.DELETE()).headers.get('set-cookie'), /Max-Age=0/);
});
