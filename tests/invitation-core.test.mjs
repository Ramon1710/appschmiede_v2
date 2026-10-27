import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkInvitation,
  createInvitationToken,
  hashInvitationToken,
  normalizeInvitationEmail,
} from '../src/lib/invitation-core.ts';
import { buildInvitationEmail } from '../src/lib/invitation-email-content.ts';
import { isAdminRole } from '../src/lib/user-utils.ts';

const now = Date.parse('2026-10-27T12:00:00.000Z');
const pendingInvitation = {
  email: 'member@example.com',
  status: 'pending',
  expiresAt: now + 7 * 24 * 60 * 60 * 1000,
};

test('valid invitation token is random and persisted as a hash only', () => {
  const first = createInvitationToken();
  const second = createInvitationToken();

  assert.notEqual(first.token, second.token);
  assert.equal(first.token.length, 43);
  assert.equal(first.tokenHash, hashInvitationToken(first.token));
  assert.notEqual(first.tokenHash, first.token);
});

test('valid invitation returns its fixed email', () => {
  assert.deepEqual(checkInvitation(pendingInvitation, now), {
    ok: true,
    email: 'member@example.com',
  });
});

test('missing invitation rejects direct registration without an invite', () => {
  assert.deepEqual(checkInvitation(null, now, 'member@example.com'), {
    ok: false,
    reason: 'invalid',
  });
});

test('only the persisted admin role grants administrator UI capability', () => {
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('user'), false);
  assert.equal(isAdminRole(null), false);
  assert.equal(isAdminRole(undefined), false);
});

test('malformed token cannot be hashed into an invitation lookup key', () => {
  assert.equal(hashInvitationToken('not-a-valid-token'), null);
});

test('expired invitation is rejected', () => {
  assert.deepEqual(
    checkInvitation({ ...pendingInvitation, expiresAt: now }, now),
    { ok: false, reason: 'expired' }
  );
});

test('revoked invitation is rejected', () => {
  assert.deepEqual(
    checkInvitation({ ...pendingInvitation, status: 'revoked' }, now),
    { ok: false, reason: 'revoked' }
  );
});

test('redeemed invitation cannot be used a second time', () => {
  assert.deepEqual(
    checkInvitation({ ...pendingInvitation, status: 'redeemed' }, now),
    { ok: false, reason: 'redeemed' }
  );
});

test('verified account email must match the invited address', () => {
  assert.deepEqual(checkInvitation(pendingInvitation, now, 'other@example.com'), {
    ok: false,
    reason: 'email-mismatch',
  });
  assert.equal(normalizeInvitationEmail(' Member@Example.com '), 'member@example.com');
});

test('invitation email uses the required subject and registration link', () => {
  const content = buildInvitationEmail('https://myappschmiede.com/invite?token=secure-token');

  assert.equal(content.subject, 'Willkommen bei Headbang Handwerk – Deine Einladung zur AppSchmiede');
  assert.match(content.text, /Herzlich willkommen bei Headbang Handwerk e\. V\.! 🤘/);
  assert.match(content.text, /ganz ohne Programmierkenntnisse/);
  assert.match(content.text, /Exklusiv für unsere Mitglieder und Partner!/);
  assert.match(content.text, /JETZT REGISTRIEREN UND APPSCHMIEDE ENTDECKEN/);
  assert.match(content.text, /Dein persönlicher Einladungslink ist sieben Tage gültig und kann nur einmal verwendet werden\./);
  assert.match(content.text, /https:\/\/myappschmiede\.com\/invite\?token=secure-token/);
  assert.match(content.text, /Wiesengrund 5/);
  assert.match(content.text, /Daniel Bigl\nRamon Meyer\nMelanie Stephan/);
  assert.match(content.html, /width="100%"/);
  assert.match(content.html, /@media screen and \(max-width: 620px\)/);
  assert.match(content.html, /https:\/\/myappschmiede\.com\/E\.V\.%20Logo\.jpeg/);
  assert.match(content.html, /href="https:\/\/myappschmiede\.com\/invite\?token=secure-token"/);
  assert.match(content.html, /Headbang Handwerk e\. V\./);
});

test('optional personal message is escaped in email HTML', () => {
  const content = buildInvitationEmail('https://example.test/invite', '<script>alert(1)</script>');

  assert.match(content.text, /<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(content.html, /<script>/);
  assert.match(content.html, /&lt;script&gt;/);
});

