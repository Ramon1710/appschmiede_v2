import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { COIN_COSTS } from '../src/config/coins.ts';

const require = createRequire(import.meta.url);

async function loadModule(path, overrides = {}, { fetcher = globalThis.fetch, env = {} } = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const loadedModule = { exports: {} };
  const scopedRequire = (name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name);
  const evaluate = new Function('require', 'module', 'exports', 'fetch', 'process', outputText);
  evaluate(scopedRequire, loadedModule, loadedModule.exports, fetcher, { env });
  return loadedModule.exports;
}

test('all editor actions are free without reading or writing historical balances', async () => {
  const billing = await loadModule('../src/lib/billing-server.ts', {
    'server-only': {},
    '@/config/billing': {},
    '@/config/coins': { COIN_COSTS },
    '@/lib/firebase-admin': {
      getFirebaseAdminDb() {
        assert.fail('Free actions must not access the balance database');
      },
    },
  });
  for (const [action, cost] of Object.entries(COIN_COSTS)) {
    assert.equal(cost, 0, `${action} must be free`);
    await billing.chargeCoinsForAction('authorized-member-with-zero-coins', action);
    await billing.chargeCoinsForAction('authorized-member-with-zero-coins', action, 10);
  }
});

for (const name of ['generate-page', 'generate-pages', 'generate-image']) {
  test(`${name} requires authorization and succeeds without billing`, async () => {
    let authorized = false;
    let providerCalls = 0;
    const request = () => new Request('http://localhost/api/ai/' + name, {
      method: 'POST',
      body: JSON.stringify({ prompt: 'A project overview' }),
    });
    const route = await loadModule(`../src/app/api/ai/${name}/route.ts`, {
      '@/lib/server-auth': {
        async requireAuthenticatedUid() {
          if (!authorized) throw new Error('app access not granted');
          return 'authorized-member-with-zero-coins';
        },
        isRequestAuthError: (error) => error.message === 'app access not granted',
      },
    }, {
      env: { OPENAI_API_KEY: 'test-key-not-a-real-credential' },
      fetcher: async () => {
        providerCalls++;
        return Response.json(name === 'generate-image'
          ? { data: [{ b64_json: 'dGVzdA==' }] }
          : { choices: [{ message: { content: JSON.stringify({
              name: 'Overview',
              tree: { id: 'root', type: 'container', children: [] },
            }) } }] });
      },
    });

    assert.equal((await route.POST(request())).status, 401);
    assert.equal(providerCalls, 0);

    authorized = true;
    const response = await route.POST(request());
    assert.equal(response.status, 200);
    const payload = await response.json();
    if (name === 'generate-pages') {
      assert.ok(Array.isArray(payload.pages) && payload.pages.length > 0);
    } else if (name === 'generate-image') {
      assert.equal(payload.dataUrl, 'data:image/png;base64,dGVzdA==');
    } else {
      assert.equal(payload.source, 'openai');
      assert.equal(payload.page.tree.id, 'root');
    }
    assert.equal(providerCalls, name === 'generate-pages' ? 0 : 1);
  });
}

for (const lang of ['de', 'en']) {
  test(`toolbox and quick buttons render without coin prices (${lang})`, async () => {
    for (const file of ['CategorizedToolbox', 'QuickButtonsPanel']) {
      const { default: Component } = await loadModule(`../src/app/editor/_components/${file}.tsx`, {
        '@/lib/i18n': { useI18n: () => ({ lang }) },
      });
      const markup = renderToStaticMarkup(createElement(Component, { onAdd() {}, onCreatePage() {} }));
      assert.doesNotMatch(markup, /coin|billing|pricing|kostenfrei|\bfree\b/i);
      assert.match(markup, /<button/);
      assert.match(markup, /<input/);
    }
  });

  test(`all block and quick-button categories open, search and select items (${lang})`, async () => {
    for (const file of ['CategorizedToolbox', 'QuickButtonsPanel']) {
      const state = [];
      let cursor = 0;
      const react = {
        ...require('react'),
        useState(initial) {
          const index = cursor++;
          if (!(index in state)) state[index] = initial;
          return [state[index], (next) => {
            state[index] = typeof next === 'function' ? next(state[index]) : next;
          }];
        },
      };
      const { default: Component } = await loadModule(`../src/app/editor/_components/${file}.tsx`, {
        react,
        '@/lib/i18n': { useI18n: () => ({ lang }) },
      });
      const selected = [];
      const render = () => {
        cursor = 0;
        const nodes = [];
        const visit = (node) => {
          if (Array.isArray(node)) return node.forEach(visit);
          if (!node || typeof node !== 'object' || !node.props) return;
          nodes.push(node);
          visit(node.props.children);
        };
        visit(Component({
          onAdd: (...args) => selected.push(args),
          onCreatePage: (...args) => selected.push(args),
        }));
        return nodes;
      };
      const categories = render().filter((node) =>
        node.type === 'button' && node.props.className.includes('font-semibold'));
      assert.ok(categories.length > 1);
      for (let index = 0; index < categories.length; index++) {
        state[0] = [];
        const closed = render().filter((node) => node.type === 'button');
        assert.equal(closed.length, categories.length);
        closed[index].props.onClick();
        const open = render().filter((node) => node.type === 'button');
        const items = open.filter((node) => !node.props.className.includes('font-semibold'));
        assert.ok(items.length > 0, `Category ${index} must expose its items`);
        const before = selected.length;
        for (const item of items) item.props.onClick();
        assert.equal(selected.length - before, items.length);
      }
      render().find((node) => node.type === 'input').props.onChange({
        target: { value: 'no-matching-editor-item-93871' },
      });
      assert.equal(render().filter((node) => node.type === 'button').length, 0);
    }
  });
}

test('desktop and mobile editor keep tabs without the cost box or an empty wrapper', async () => {
  const source = await readFile(new URL('../src/app/editor/_components/EditorShell.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /editorCostSummary|Coin-Kosten|Coin costs|formatCoin|COIN_COSTS|requireCoins|coinAction|Kostenfrei|Free per use/);
  assert.match(source, /assertAuthorizedAction\(user\)/);
  assert.match(source, /Bausteine & Vorlagen/);
  assert.equal((source.match(/id: 'components', label: tr\('Bausteine', 'Blocks'\)/g) ?? []).length, 2);
  assert.equal((source.match(/id: 'quick-buttons', label: tr\('Fertige Buttons', 'Quick buttons'\)/g) ?? []).length, 2);
  assert.equal((source.match(/id: 'templates', label: tr\('Vorlagen', 'Templates'\)/g) ?? []).length, 2);
  assert.doesNotMatch(source, /<div className="mt-4">\s*<\/div>/);
});

test('all template variants keep application actions and admin save controls', async () => {
  const source = await readFile(new URL('../src/app/editor/_components/EditorShell.tsx', import.meta.url), 'utf8');
  for (const action of [
    'applyAuthorizedTemplate(tpl.template)',
    'applyAuthorizedSavedPageTemplate(tpl)',
    'applySavedAppTemplateToProject(tpl)',
    'onClick={handleSavePageTemplate}',
    'onClick={handleSaveAppTemplate}',
  ]) {
    assert.ok(source.includes(action), `${action} must remain available`);
  }
});
