import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const passwordUser = () => ({
  uid: 'member',
  email: 'member@example.com',
  displayName: 'Member',
  providerData: [{ providerId: 'password' }],
  getIdToken: async () => 'test-id-token',
});

async function loadModule(path, overrides = {}, globals = {}) {
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
  const evaluate = new Function('require', 'module', 'exports', ...Object.keys(globals), outputText);
  evaluate(scopedRequire, loadedModule, loadedModule.exports, ...Object.values(globals));
  return loadedModule.exports;
}

async function passwordFixture({ validation, reauthError, updateError } = {}) {
  const calls = [];
  const api = await loadModule('../src/lib/profile-password.ts', {
    '@/lib/firebase': { auth: {} },
    'firebase/auth': {
      EmailAuthProvider: {
        credential(email, password) {
          calls.push(['credential', email, password]);
          return { email, password };
        },
      },
      async reauthenticateWithCredential(user, credential) {
        calls.push(['reauth', user.uid, credential.password]);
        if (reauthError) throw reauthError;
      },
      async validatePassword(_auth, password) {
        calls.push(['validate', password]);
        return validation ?? { isValid: true };
      },
      async updatePassword(user, password) {
        calls.push(['update', user.uid, password]);
        if (updateError) throw updateError;
      },
    },
  });
  return { api, calls };
}

test('password confirmation is checked before any Firebase request', async () => {
  const { api, calls } = await passwordFixture();
  await assert.rejects(() => api.changeProfilePassword(passwordUser(), 'old', 'new', 'different'), /stimmen nicht/);
  await assert.rejects(() => api.changeProfilePassword(passwordUser(), 'old', '', ''), /neues Passwort/);
  assert.deepEqual(calls, []);
});

test('Firebase password policy explains unmet length and complexity requirements', async () => {
  const { api, calls } = await passwordFixture({
    validation: {
      isValid: false,
      meetsMinPasswordLength: false,
      meetsMaxPasswordLength: false,
      containsLowercaseLetter: false,
      containsUppercaseLetter: false,
      containsNumericCharacter: false,
      containsNonAlphanumericCharacter: false,
      passwordPolicy: { customStrengthOptions: { minPasswordLength: 12, maxPasswordLength: 64 } },
    },
  });
  await assert.rejects(() => api.changeProfilePassword(passwordUser(), 'old', 'new', 'new'), (error) => {
    const message = api.profileAuthErrorMessage(error);
    for (const requirement of ['12', '64', 'Kleinbuchstaben', 'Großbuchstaben', 'Zahl', 'Sonderzeichen']) {
      assert.ok(message.includes(requirement));
    }
    return true;
  });
  assert.deepEqual(calls, [['validate', 'new']]);
});

test('wrong current password prevents updatePassword', async () => {
  const { api, calls } = await passwordFixture({ reauthError: { code: 'auth/invalid-credential' } });
  await assert.rejects(() => api.changeProfilePassword(passwordUser(), 'wrong', 'new-valid', 'new-valid'));
  assert.equal(calls.some(([kind]) => kind === 'update'), false);
  assert.match(api.profileAuthErrorMessage({ code: 'auth/invalid-credential' }), /nicht korrekt/);
});

test('empty current password is rejected without updating Firebase', async () => {
  const { api, calls } = await passwordFixture();
  await assert.rejects(() => api.changeProfilePassword(passwordUser(), '', 'new-valid', 'new-valid'), /aktuelles Passwort/);
  assert.equal(calls.some(([kind]) => kind === 'reauth' || kind === 'update'), false);
});

test('valid password is updated only after policy validation and reauthentication', async () => {
  const { api, calls } = await passwordFixture();
  await api.changeProfilePassword(passwordUser(), 'old', 'new-valid', 'new-valid');
  assert.deepEqual(calls, [
    ['validate', 'new-valid'],
    ['credential', 'member@example.com', 'old'],
    ['reauth', 'member', 'old'],
    ['update', 'member', 'new-valid'],
  ]);
});

test('other login providers do not trigger password authentication or update', async () => {
  const { api, calls } = await passwordFixture();
  const user = { ...passwordUser(), providerData: [{ providerId: 'google.com' }] };
  assert.equal(api.supportsPasswordChange(user), false);
  await assert.rejects(() => api.changeProfilePassword(user, 'old', 'new', 'new'), /Anmeldeanbieter/);
  assert.deepEqual(calls, []);
});

test('Firebase policy rejection, throttling and network failures have safe error messages', async () => {
  const { api } = await passwordFixture({ updateError: { code: 'auth/password-does-not-meet-requirements' } });
  await assert.rejects(() => api.changeProfilePassword(passwordUser(), 'old', 'new', 'new'));
  assert.match(api.profileAuthErrorMessage({ code: 'auth/password-does-not-meet-requirements' }), /Passwortrichtlinie/);
  assert.match(api.profileAuthErrorMessage({ code: 'auth/too-many-requests' }), /Zu viele Versuche/);
  assert.match(api.profileAuthErrorMessage({ code: 'auth/network-request-failed' }), /Internetverbindung/);
  assert.match(api.profileAuthErrorMessage({ code: 'auth/requires-recent-login' }), /erneut an/);
  assert.doesNotMatch(api.profileAuthErrorMessage(new Error('secret-password')), /secret-password/);
});

async function deletionFixture({ authorized = true, age = 0, failAuthDelete = false, failProfileDelete = false } = {}) {
  const calls = [];
  class AuthError extends Error {}
  const route = await loadModule('../src/app/api/account/route.ts', {
    '@/lib/server-auth': {
      APP_SESSION_COOKIE: '__session',
      isRequestAuthError: (error) => error instanceof AuthError,
      async requireAuthenticatedUid() {
        if (!authorized) throw new AuthError('not authorized');
        return 'member';
      },
      async requireAuthenticatedIdentity() {
        return { uid: 'member', auth_time: Math.floor(Date.now() / 1000) - age };
      },
    },
    '@/lib/firebase-admin': {
      getFirebaseAdminAuth: () => ({
        async deleteUser(uid) {
          calls.push(['delete-auth', uid]);
          if (failAuthDelete) throw new Error('test auth failure');
        },
      }),
      getFirebaseAdminDb: () => ({
        collection(name) {
          assert.equal(name, 'users');
          return { doc: (uid) => ({
            async delete() {
              calls.push(['delete-profile', uid]);
              if (failProfileDelete) throw new Error('test profile failure');
            },
          }) };
        },
      }),
    },
  });
  const request = (body = { confirmed: true }) => new Request('http://localhost/api/account', {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
  return { route, calls, request };
}

test('account deletion requires authorization, recent authentication and explicit confirmation', async () => {
  for (const [options, body, status] of [
    [{ authorized: false }, { confirmed: true }, 401],
    [{ age: 301 }, { confirmed: true }, 403],
    [{ age: -60 }, { confirmed: true }, 403],
    [{}, {}, 400],
    [{}, { confirmed: false }, 400],
    [{}, { confirmed: 'true' }, 400],
  ]) {
    const { route, calls, request } = await deletionFixture(options);
    assert.equal((await route.DELETE(request(body))).status, status);
    assert.deepEqual(calls, []);
  }
});

test('confirmed deletion uses only the authenticated UID and clears the session cookie', async () => {
  const { route, calls, request } = await deletionFixture();
  const response = await route.DELETE(request({ confirmed: true, uid: 'another-admin' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { accountDeleted: true });
  assert.deepEqual(calls, [['delete-auth', 'member'], ['delete-profile', 'member']]);
  assert.match(response.headers.get('set-cookie'), /__session=;/);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
});

test('auth deletion failure preserves the profile and partial cleanup is reported explicitly', async () => {
  const first = await deletionFixture({ failAuthDelete: true });
  const failed = await first.route.DELETE(first.request());
  assert.equal(failed.status, 500);
  assert.equal((await failed.json()).accountDeleted, undefined);
  assert.deepEqual(first.calls, [['delete-auth', 'member']]);

  const second = await deletionFixture({ failProfileDelete: true });
  const partial = await second.route.DELETE(second.request());
  assert.equal(partial.status, 500);
  const result = await partial.json();
  assert.equal(result.accountDeleted, true);
  assert.match(result.error, /Profildaten konnten nicht/);
  assert.match(partial.headers.get('set-cookie'), /Max-Age=0/);
});

function componentHarness() {
  const state = [];
  const refs = [];
  const effects = [];
  let stateCursor = 0;
  let refCursor = 0;
  let effectCursor = 0;
  let pending = [];
  const react = {
    ...require('react'),
    useState(initial) {
      const index = stateCursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (next) => {
        state[index] = typeof next === 'function' ? next(state[index]) : next;
      }];
    },
    useRef(initial) {
      const index = refCursor++;
      return refs[index] ??= { current: initial };
    },
    useMemo: (callback) => callback(),
    useEffect(callback, deps) {
      const index = effectCursor++;
      if (!effects[index] || deps.some((dep, offset) => dep !== effects[index][offset])) {
        effects[index] = deps;
        pending.push(callback);
      }
    },
  };
  return {
    react,
    render(Component, props) {
      stateCursor = refCursor = effectCursor = 0;
      pending = [];
      const nodes = [];
      const visit = (node) => {
        if (Array.isArray(node)) return node.forEach(visit);
        if (!node || typeof node !== 'object' || !node.props) return;
        nodes.push(node);
        if (node.type === 'dialog') node.props.ref.current = { showModal() {}, close() {} };
        visit(node.props.children);
      };
      visit(Component(props));
      pending.forEach((effect) => effect());
      return nodes;
    },
  };
}

const buttonText = (node) => Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children;
const clickButton = (nodes, label) => {
  const button = nodes.find((node) => node.type === 'button' && buttonText(node) === label);
  assert.ok(button, `Button "${label}" must exist`);
  button.props.onClick();
};

async function securityComponentFixture(provider = 'password', { sessionOk = true } = {}) {
  const harness = componentHarness();
  const calls = [];
  const user = { ...passwordUser(), providerData: [{ providerId: provider }] };
  const { default: Component } = await loadModule('../src/app/profile/ProfileSecurityActions.tsx', {
    react: harness.react,
    '@/lib/firebase': { auth: {} },
    '@/lib/client-auth': { buildAuthHeaders: async () => ({}) },
    'firebase/auth': { signOut: async () => calls.push(['sign-out']) },
    'next/navigation': { useRouter: () => ({ replace: (url) => calls.push(['navigate', url]) }) },
    '@/lib/profile-password': {
      supportsPasswordChange: (user) => user.providerData.some((provider) => provider.providerId === 'password'),
      changeProfilePassword: async (...args) => calls.push(['change-password', ...args.slice(1)]),
      reauthenticateProfileUser: async (_user, password) => calls.push(['reauth', password]),
      profileAuthErrorMessage: () => 'Test authentication error',
    },
  }, {
    fetch: async (url, init) => {
      calls.push(['fetch', url, init]);
      return url === '/api/account'
        ? Response.json({ accountDeleted: true })
        : Response.json({}, { status: sessionOk ? 200 : 403 });
    },
  });
  return { calls, render: () => harness.render(Component, { user, disabled: false }) };
}

test('password button opens its own three-field dialog and clears secrets on cancel', async () => {
  const fixture = await securityComponentFixture();
  assert.equal(fixture.render().some((node) => node.type === 'dialog'), false);
  clickButton(fixture.render(), 'Passwort ändern');
  let nodes = fixture.render();
  const fields = nodes.filter((node) => node.type === 'input');
  assert.equal(fields.length, 3);
  assert.deepEqual(fields.map((node) => node.props.autoComplete), ['current-password', 'new-password', 'new-password']);
  fields.forEach((field) => field.props.onChange({ target: { value: 'secret' } }));
  clickButton(fixture.render(), 'Abbrechen');
  clickButton(fixture.render(), 'Passwort ändern');
  nodes = fixture.render();
  assert.ok(nodes.filter((node) => node.type === 'input').every((node) => node.props.value === ''));
  assert.deepEqual(fixture.calls, []);
});

test('password success is confirmed and the app session is renewed', async () => {
  for (const sessionOk of [true, false]) {
    const fixture = await securityComponentFixture('password', { sessionOk });
    clickButton(fixture.render(), 'Passwort ändern');
    const fields = fixture.render().filter((node) => node.type === 'input');
    ['old', 'new', 'new'].forEach((value, index) => fields[index].props.onChange({ target: { value } }));
    await fixture.render().find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
    const notice = fixture.render().find((node) => node.props.role === 'status');
    assert.match(notice.props.children, sessionOk ? /erfolgreich geändert/ : /erneut an/);
    assert.ok(fixture.calls.some(([kind, url]) => kind === 'fetch' && url === '/api/auth/session'));
  }
});

test('non-password accounts receive an alternative without password fields or submit button', async () => {
  const fixture = await securityComponentFixture('google.com');
  clickButton(fixture.render(), 'Passwort ändern');
  const nodes = fixture.render();
  assert.equal(nodes.filter((node) => node.type === 'input').length, 0);
  assert.equal(nodes.filter((node) => node.type === 'button' && node.props.type === 'submit').length, 0);
  assert.ok(nodes.some((node) => typeof node.props.children === 'string' && node.props.children.includes('Kontoeinstellungen')));
});

test('account deletion only executes after submitting the explicit confirmation dialog', async () => {
  const fixture = await securityComponentFixture();
  clickButton(fixture.render(), 'Account löschen');
  assert.deepEqual(fixture.calls, []);
  clickButton(fixture.render(), 'Abbrechen');
  assert.deepEqual(fixture.calls, []);
  clickButton(fixture.render(), 'Account löschen');
  fixture.render().find((node) => node.type === 'input').props.onChange({ target: { value: 'old' } });
  await fixture.render().find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(fixture.calls[0], ['reauth', 'old']);
  const request = fixture.calls.find(([kind, url]) => kind === 'fetch' && url === '/api/account');
  assert.equal(JSON.parse(request[2].body).confirmed, true);
  assert.ok(fixture.calls.some(([kind]) => kind === 'sign-out'));
  assert.ok(fixture.calls.some(([kind, url]) => kind === 'navigate' && url === '/'));
});

test('personal data save and existing email reauthentication remain independent of password changes', async () => {
  const harness = componentHarness();
  const user = passwordUser();
  const writes = [];
  const authCalls = [];
  const { default: Page } = await loadModule('../src/app/profile/page.tsx', {
    react: harness.react,
    '@/components/Header': { __esModule: true, default: () => null },
    './ProfileSecurityActions': { __esModule: true, default: () => null },
    '@/hooks/useAuth': { __esModule: true, default: () => ({ user, loading: false }) },
    '@/lib/firebase': { db: {} },
    'firebase/firestore': {
      doc: (_db, collection, uid) => ({ collection, uid }),
      getDoc: async () => ({ exists: () => true, data: () => ({}) }),
      serverTimestamp: () => 'server-timestamp',
      setDoc: async (...args) => writes.push(args),
    },
    'firebase/auth': {
      updateProfile: async (_user, data) => authCalls.push(['profile', data]),
      EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
      reauthenticateWithCredential: async (_user, credential) => authCalls.push(['reauth', credential]),
      updateEmail: async (_user, email) => authCalls.push(['email', email]),
    },
  });
  const render = () => harness.render(Page);
  render();
  await new Promise(setImmediate);
  const inputs = render().filter((node) => node.type === 'input');
  const values = ['Alex', 'Meyer', 'Alex Meyer', 'Company', '+49 170 1234567', 'new@example.com', 'email-only-password'];
  assert.equal(inputs.length, values.length);
  inputs.forEach((input, index) => input.props.onChange({ target: { value: values[index] } }));
  await render().find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(authCalls, [
    ['profile', { displayName: 'Alex Meyer' }],
    ['reauth', { email: 'member@example.com', password: 'email-only-password' }],
    ['email', 'new@example.com'],
  ]);
  assert.deepEqual(writes, [[
    { collection: 'users', uid: 'member' },
    {
      displayName: 'Alex Meyer', firstName: 'Alex', lastName: 'Meyer', company: 'Company',
      phone: '+49 170 1234567', email: 'new@example.com', updatedAt: 'server-timestamp',
    },
    { merge: true },
  ]]);
  assert.equal(render().filter((node) => node.type === 'input').at(-1).props.value, '');
});

test('profile has no subscription UI and password code never stores or logs passwords', async () => {
  const page = await readFile(new URL('../src/app/profile/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /Aktuelles Abo|Free-Plan|Coins|Tarife und Abos|Abo kündigen|subscription|billingMethod/);
  assert.match(page, /ProfileSecurityActions user=\{user\} disabled=\{busy\}/);
  for (const path of ['../src/lib/profile-password.ts', '../src/app/profile/ProfileSecurityActions.tsx']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /localStorage|sessionStorage|firebase\/firestore|console\./);
  }
});
