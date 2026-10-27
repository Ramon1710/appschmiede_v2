import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);

async function loadModule(path, overrides = {}, fetcher = globalThis.fetch) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  const scopedRequire = (name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name);
  const evaluate = new Function('require', 'module', 'exports', 'fetch', outputText);
  evaluate(scopedRequire, module, module.exports, fetcher);
  return module.exports;
}

for (const path of ['stripe/checkout', 'billing/action']) {
  test(`${path} is permanently disabled without calling a payment provider`, async () => {
    const route = await loadModule(`../src/app/api/${path}/route.ts`);
    const response = await route.POST();
    assert.equal(response.status, 410);
    assert.equal(typeof (await response.json()).error, 'string');
  });
}

test('authorized action checks only access, without a billing request or balance', async () => {
  const calls = [];
  const client = await loadModule('../src/lib/access-client.ts', {
    '@/lib/client-auth': { buildAuthHeaders: async () => ({ Authorization: 'Bearer test' }) },
  }, async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ authorized: true }), { status: 200 });
  });
  await client.assertAuthorizedAction({ uid: 'member', coinsBalance: 0 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/access/status');
  assert.equal(calls[0].init.body, undefined);
});

test('non-invited account is rejected by the same access check', async () => {
  const client = await loadModule('../src/lib/access-client.ts', {
    '@/lib/client-auth': { buildAuthHeaders: async () => ({ Authorization: 'Bearer test' }) },
  }, async () => new Response('{}', { status: 403 }));
  await assert.rejects(() => client.assertAuthorizedAction({ uid: 'unknown' }), /freigeschalteter/);
});

test('AI routes retain authorization and technical limits without billing', async () => {
  for (const route of ['generate-page', 'generate-pages', 'generate-image']) {
    const source = await readFile(new URL(`../src/app/api/ai/${route}/route.ts`, import.meta.url), 'utf8');
    assert.match(source, /requireAuthenticatedUid\(request\)/);
    assert.match(source, /'ai-minute', 10, uid/);
    assert.match(source, /'ai-day', 100, uid/);
    assert.doesNotMatch(source, /chargeCoins|billing-server|coinsBalance|status: 402/);
  }
});

test('editor and template surfaces contain no coin costs or balance gates', async () => {
  for (const path of [
    '../src/app/editor/_components/EditorShell.tsx',
    '../src/app/editor/_components/CategorizedToolbox.tsx',
    '../src/app/editor/_components/QuickButtonsPanel.tsx',
    '../src/app/tools/templates/page.tsx',
    '../src/components/Header.tsx',
  ]) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /COIN_COSTS|coinsBalance|chargeCoins|CoinActionKey|formatCoin|\/pricing|\/tools\/billing/);
  }
});

test('historical billing module cannot debit balances or restrict project creation', async () => {
  const source = await readFile(new URL('../src/lib/billing-server.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /export async function (chargeCoins|assertCanCreateProject)|coinsBalance: current -/);
});