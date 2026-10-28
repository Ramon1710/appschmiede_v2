import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function load(path, overrides = {}) {
  const { outputText } = ts.transpileModule(await source(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  });
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(
    (name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name),
    loaded, loaded.exports
  );
  return loaded.exports;
}

for (const plan of ['free', 'starter', 'pro', 'business']) {
  test(`legacy creation check requires access but no ${plan} plan, count or coin lookup`, async () => {
    let authorized = true;
    const route = await load('src/app/api/billing/action/route.ts', {
      '@/lib/server-auth': {
        requireAuthenticatedUid: async () => {
          if (!authorized) throw new Error('denied');
          return `member-${plan}-with-10001-projects`;
        },
        isRequestAuthError: (error) => error.message === 'denied',
      },
      '@/lib/billing-server': {
        isBillingError: () => false,
        chargeCoinsForAction: () => assert.fail('Creation must not read or charge coins'),
        assertCanCreateProject: () => assert.fail('Legacy plan/count gate must not be used'),
      },
    });
    const request = () => new Request('http://localhost/api/billing/action', {
      method: 'POST', body: JSON.stringify({ kind: 'assert-project-create' }),
    });
    assert.equal((await route.POST(request())).status, 200);
    authorized = false;
    assert.equal((await route.POST(request())).status, 401);
  });
}

test('all plans lack project caps and historical display rows say unlimited in both languages', async () => {
  const billing = await load('src/config/billing.ts');
  for (const config of Object.values(billing.PLAN_CONFIG)) assert.equal('maxProjects' in config, false);
  const home = await load('src/lib/home-content.ts', { '@/config/billing': billing });
  for (const lang of ['de', 'en']) {
    const row = home.getHomeContent(lang).planFeatureRows.find((row) => row.feature === (lang === 'de' ? 'Aktive Projekte' : 'Active projects'));
    assert.deepEqual(Object.values(row.values), Array(4).fill(lang === 'de' ? 'Unbegrenzt' : 'Unlimited'));
  }
});

test('shared project service creates beyond 9999, lists, subscribes, renames and deletes without truncation', async () => {
  const store = new Map([['existing', { name: 'Existing', ownerId: 'member', ownerUid: 'member', members: ['member'] }]]);
  const service = await load('src/lib/db-projects.ts', {
    '@/lib/firebase': { db: {} },
    'firebase/firestore': {
      collection: (_db, name) => name,
      doc: (_db, name, id) => ({ name, id }),
      serverTimestamp: () => 1,
      addDoc: async (name, value) => {
        assert.equal(name, 'projects');
        const id = `project-${store.size}`;
        store.set(id, value);
        return { id };
      },
      where: (field, operator, value) => ({ field, operator, value }),
      query: (name, condition, ...extra) => {
        assert.deepEqual(extra, []);
        return { name, condition };
      },
      getDocs: async ({ condition }) => ({
        docs: [...store].filter(([, value]) => value[condition.field] === condition.value)
          .map(([id, value]) => ({ id, data: () => value })),
      }),
      onSnapshot: ({ condition }, callback) => {
        callback({ docs: [...store].filter(([, value]) => value[condition.field] === condition.value)
          .map(([id, value]) => ({ id, data: () => value })) });
        return () => {};
      },
      updateDoc: async ({ id }, patch) => store.set(id, { ...store.get(id), ...patch }),
      deleteDoc: async ({ id }) => store.delete(id),
    },
  });
  let latest;
  for (let index = 0; index < 10005; index++) latest = await service.createProject(`Project ${index}`, 'member');
  assert.equal((await service.listProjects('member')).length, 10006);
  let subscribed;
  service.subscribeProjects('member', (projects) => { subscribed = projects; });
  assert.equal(subscribed.length, 10006);
  await service.renameProject(latest, 'Renamed');
  assert.equal(store.get(latest).name, 'Renamed');
  await service.removeProject(latest);
  assert.equal((await service.listProjects('member')).length, 10005);
  assert.equal(store.get('existing').name, 'Existing');
});

for (const lang of ['de', 'en']) {
  test(`homepage removes only requested AI visuals while retaining all workflow descriptions (${lang})`, async () => {
    const billing = await load('src/config/billing.ts');
    const content = await load('src/lib/home-content.ts', { '@/config/billing': billing });
    const { default: Home } = await load('src/app/page.tsx', {
      'next/headers': { cookies: async () => ({ get: () => ({ value: lang }) }) },
      '@/components/Header': { __esModule: true, default: () => null },
      '@/components/AppLogo': { __esModule: true, default: () => null },
      '@/lib/home-content': content,
    });
    const html = renderToStaticMarkup(await Home());
    assert.doesNotMatch(html, /KI-Eingabe|KI-Generator|AI Generator|Prompt zur App-Struktur|Prompt to app structure|KI an deiner Seite|AI by your side|Vorgeschlagene Bausteine|Suggested stack|Build a service app with jobs, photos, chat, and time tracking for mobile teams/);
    for (const step of content.getHomeContent(lang).workflowSteps) {
      assert.ok(html.includes(renderToStaticMarkup(createElement('h3', null, step.title)).slice(4, -5)), step.title);
      assert.ok(html.includes(renderToStaticMarkup(createElement('p', null, step.description)).slice(3, -4)), step.description);
    }
    assert.match(html, /id="headbang-handwerk-title"/);
    assert.match(html, /href="https:\/\/www.headbang-handwerk.com\/"/);
    assert.match(html, /id="workflow"/);
    assert.match(html, /xl:grid-cols-3/);
    assert.match(html, /id="praxis"/);
    assert.doesNotMatch(html, /<section[^>]*>\s*<\/section>/);
  });
}

test('project UI and services have no hidden cap while keeping authorization and all-project rendering', async () => {
  for (const path of ['src/config/billing.ts', 'src/lib/billing-server.ts', 'src/lib/billing-client.ts']) {
    assert.doesNotMatch(await source(path), /maxProjects|project_limit|assertCanCreateProject/);
  }
  const projects = await source('src/app/projects/page.tsx');
  assert.doesNotMatch(projects, /Dein Tarif bestimmt|Your plan determines|\.slice\(|limit\(/);
  assert.match(projects, /await assertAuthorizedAction\(auth.currentUser\)/);
  assert.match(projects, /sortedProjects\.map/);
  for (const path of ['chat', 'time']) {
    const code = await source(`src/app/tools/${path}/page.tsx`);
    const projectQuery = code.split('\n').find((line) => line.includes("collection(db, 'projects')"));
    assert.ok(projectQuery);
    assert.doesNotMatch(projectQuery, /limit\(/);
  }
  for (const path of ['src/app/tools/gewerke/page.tsx', 'src/app/tools/templates/page.tsx']) {
    assert.match(await source(path), /assertAuthorizedAction/);
  }
});

for (const lang of ['de', 'en']) {
  test(`project overview renders all 200 projects and retains creation controls (${lang})`, async () => {
    let cursor = 0;
    const projects = Array.from({ length: 200 }, (_, index) => ({
      id: `project-${index}`, name: `StoredProjectNumber${index}`, ownerId: 'member',
      updatedAt: index + 1,
    }));
    const initialStates = [{ uid: 'member', email: 'member@example.test' }, '', projects];
    const react = {
      ...require('react'),
      useState: (initial) => {
        const index = cursor++;
        return [index < initialStates.length ? initialStates[index] : initial, () => {}];
      },
      useEffect: () => {},
      useRef: () => ({ current: null }),
    };
    const { default: Projects } = await load('src/app/projects/page.tsx', {
      react,
      'next/navigation': { useRouter: () => ({ push: () => {} }) },
      'firebase/auth': {},
      '@/lib/firebase': { auth: {} },
      '@/components/Header': { __esModule: true, default: () => null },
      '@/components/GuidedTour': { __esModule: true, default: () => null },
      '@/components/UnauthenticatedScreen': { __esModule: true, default: () => assert.fail('User is authenticated') },
      '@/lib/db-projects': { PROJECT_ICON_CHOICES: ['x'] },
      '@/lib/editor-storage': {},
      '@/lib/i18n': { useI18n: () => ({ lang }) },
      '@/lib/access-client': {},
    });
    const html = renderToStaticMarkup(createElement(Projects));
    assert.equal((html.match(/StoredProjectNumber\d+/g) ?? []).length, 200);
    assert.match(html, /data-tour-id="projects-create-input"/);
    assert.match(html, /data-tour-id="projects-create-button"/);
    assert.match(html, /sm:flex-row/);
    assert.doesNotMatch(html, /Dein Tarif bestimmt|Your plan determines/);
  });
}
