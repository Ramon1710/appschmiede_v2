import nodemailer, { type SendMailOptions } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type SmtpFailureCode = 'not_configured' | 'authentication_failed' | 'timeout' | 'send_failed';

export function smtpFailureMessage(code: SmtpFailureCode): string {
  if (code === 'not_configured') return 'SMTP-Versand ist nicht korrekt eingerichtet. Bitte SMTP_HOST, SMTP_PORT (465 oder 587), SMTP_USER, SMTP_PASS und SMTP_FROM prüfen.';
  if (code === 'authentication_failed') return 'Anmeldung am SMTP-Server fehlgeschlagen. Bitte die SMTP-Zugangsdaten prüfen.';
  if (code === 'timeout') return 'Zeitüberschreitung beim SMTP-Versand. Die Annahme der Nachricht ist unklar. Bitte den Versandstatus beim Mailanbieter prüfen.';
  return 'Der SMTP-Versand konnte nicht bestätigt werden. Bitte Mailanbieter und Empfängeradresse prüfen.';
}

export class SmtpDeliveryError extends Error {
  readonly code: SmtpFailureCode;

  constructor(code: SmtpFailureCode) {
    super(code);
    this.name = 'SmtpDeliveryError';
    this.code = code;
  }
}

export function readSmtpConfiguration(environment: Record<string, string | undefined> = process.env) {
  const host = environment.SMTP_HOST?.trim();
  const port = Number(environment.SMTP_PORT?.trim());
  const user = environment.SMTP_USER?.trim();
  const pass = environment.SMTP_PASS;
  const from = environment.SMTP_FROM?.trim();
  if (!host || /[\s\r\n]/.test(host) || ![465, 587].includes(port) || !user ||
      !pass || !pass.trim() || !from || /[\r\n]/.test(from) || !from.includes('@')) {
    throw new SmtpDeliveryError('not_configured');
  }

  const options: SMTPTransport.Options = {
    host,
    port,
    secure: port === 465,
    requireTLS: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  };
  return { from, options };
}

type SmtpTransport = {
  sendMail(message: SendMailOptions): Promise<{
    messageId: string;
    accepted?: Array<string | { address: string }>;
    rejected?: Array<string | { address: string }>;
  }>;
  close(): void;
};

type TransportFactory = (options: SMTPTransport.Options) => SmtpTransport;

export async function sendSmtpMessage(
  message: { to: string; subject: string; text: string; html: string; deliveryId: string },
  environment: Record<string, string | undefined> = process.env,
  createTransport: TransportFactory = (options) => nodemailer.createTransport(options)
): Promise<string> {
  const { from, options } = readSmtpConfiguration(environment);
  let transport: SmtpTransport | undefined;
  try {
    transport = createTransport(options);
    const result = await transport.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: { 'X-AppSchmiede-Invitation-ID': message.deliveryId },
    });
    const accepted = result.accepted?.some((recipient) =>
      (typeof recipient === 'string' ? recipient : recipient.address).toLowerCase() === message.to.toLowerCase()
    );
    if (!accepted || result.rejected?.length || !result.messageId) {
      throw new SmtpDeliveryError('send_failed');
    }
    return result.messageId;
  } catch (error) {
    if (error instanceof SmtpDeliveryError) throw error;
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    if (code === 'EAUTH') throw new SmtpDeliveryError('authentication_failed');
    if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') throw new SmtpDeliveryError('timeout');
    throw new SmtpDeliveryError('send_failed');
  } finally {
    transport?.close();
  }
}