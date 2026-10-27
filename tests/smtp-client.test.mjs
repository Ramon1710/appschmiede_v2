import assert from 'node:assert/strict';
import test from 'node:test';
import { readSmtpConfiguration, sendSmtpMessage, SmtpDeliveryError, smtpFailureMessage } from '../src/lib/smtp-client.ts';
import { buildInvitationEmail } from '../src/lib/invitation-email-content.ts';

const environment = {
  SMTP_HOST: 'smtp.example.test', SMTP_PORT: '465', SMTP_USER: 'test-user',
  SMTP_PASS: 'private-test-password',
  SMTP_FROM: 'Headbang Handwerk e. V. <ramon.meyer@headbang-handwerk.de>',
};
const link = 'https://myappschmiede.com/invite?token=existing-test-token';
const message = { to: 'member@example.test', ...buildInvitationEmail(link), deliveryId: 'invitation-id' };

test('465 uses implicit TLS and 587 enforces STARTTLS with certificate validation', () => {
  for (const port of ['465', '587']) {
    const { options } = readSmtpConfiguration({ ...environment, SMTP_PORT: port });
    assert.equal(options.secure, port === '465');
    assert.equal(options.requireTLS, true);
    assert.equal(options.tls.rejectUnauthorized, true);
    assert.equal(options.tls.minVersion, 'TLSv1.2');
    assert.equal(options.auth.user, environment.SMTP_USER);
    assert.equal(options.auth.pass, environment.SMTP_PASS);
    assert.equal(options.connectionTimeout, 10000);
    assert.equal(options.greetingTimeout, 10000);
    assert.equal(options.socketTimeout, 30000);
    assert.equal(options.logger, false);
    assert.equal(options.debug, false);
  }
});

test('all missing SMTP settings and insecure ports fail before transport creation', async () => {
  for (const key of Object.keys(environment)) {
    await assert.rejects(() => sendSmtpMessage(message, { ...environment, [key]: '' }, () => {
      assert.fail('transport must not be created');
    }), { code: 'not_configured' });
  }
  assert.throws(() => readSmtpConfiguration({ ...environment, SMTP_PORT: '25' }), { code: 'not_configured' });
  assert.throws(() => readSmtpConfiguration({ ...environment, SMTP_FROM: 'bad\r\nBcc: other@example.test' }), { code: 'not_configured' });
});

test('successful SMTP acceptance preserves sender, HTML, text and the existing invite link', async () => {
  let closed = false;
  const id = await sendSmtpMessage(message, environment, () => ({
    async sendMail(mail) {
      assert.equal(mail.from, environment.SMTP_FROM);
      assert.equal(mail.to, message.to);
      assert.equal(mail.text, message.text);
      assert.equal(mail.html, message.html);
      assert.ok(mail.text.includes(link));
      assert.ok(mail.html.includes(link));
      assert.ok(mail.html.includes('/E.V.%20Logo.jpeg'));
      assert.equal(mail.headers['X-AppSchmiede-Invitation-ID'], 'invitation-id');
      return { messageId: 'smtp-message-id', accepted: [message.to], rejected: [] };
    },
    close() { closed = true; },
  }));
  assert.equal(id, 'smtp-message-id');
  assert.equal(closed, true);
});

for (const [providerCode, expectedCode] of [['EAUTH', 'authentication_failed'], ['ETIMEDOUT', 'timeout'], ['ECONNECTION', 'send_failed'], ['ESOCKET', 'send_failed']]) {
  test(`SMTP ${providerCode} becomes a safe ${expectedCode} error and closes transport`, async () => {
    let closed = false;
    await assert.rejects(() => sendSmtpMessage(message, environment, () => ({
      async sendMail() { throw Object.assign(new Error(`secret ${environment.SMTP_PASS} ${link}`), { code: providerCode }); },
      close() { closed = true; },
    })), (error) => {
      assert.ok(error instanceof SmtpDeliveryError);
      assert.equal(error.code, expectedCode);
      assert.ok(!String(error).includes(environment.SMTP_PASS));
      assert.ok(!String(error).includes(link));
      assert.equal(error.cause, undefined);
      return true;
    });
    assert.equal(closed, true);
  });
}

test('SMTP error messages explain configuration, authentication and uncertain timeouts safely', () => {
  assert.match(smtpFailureMessage('not_configured'), /SMTP_HOST/);
  assert.match(smtpFailureMessage('authentication_failed'), /Anmeldung/);
  assert.match(smtpFailureMessage('timeout'), /unklar/);
  for (const code of ['not_configured', 'authentication_failed', 'timeout', 'send_failed']) {
    assert.ok(!smtpFailureMessage(code).includes(environment.SMTP_PASS));
    assert.ok(!smtpFailureMessage(code).includes(link));
  }
});

test('rejected recipient is not reported as successfully sent', async () => {
  await assert.rejects(() => sendSmtpMessage(message, environment, () => ({
    async sendMail() { return { messageId: 'rejected', accepted: [], rejected: [message.to] }; },
    close() {},
  })), { code: 'send_failed' });
});

test('explicit resend transmits the supplied replacement link without creating a token', async () => {
  const sent = [];
  const factory = () => ({
    async sendMail(mail) { sent.push(mail); return { messageId: `message-${sent.length}`, accepted: [message.to] }; },
    close() {},
  });
  await sendSmtpMessage(message, environment, factory);
  const replacementLink = 'https://myappschmiede.com/invite?token=replacement-from-invitation-service';
  await sendSmtpMessage({ ...message, ...buildInvitationEmail(replacementLink), deliveryId: 'replacement-id' }, environment, factory);
  assert.equal(sent.length, 2);
  assert.ok(sent[0].text.includes(link));
  assert.ok(sent[1].html.includes(replacementLink));
  assert.ok(!sent[1].text.includes(link));
});