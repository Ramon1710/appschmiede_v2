import 'server-only';

import { buildInvitationEmail } from '@/lib/invitation-email-content';
import { readSmtpConfiguration, sendSmtpMessage, SmtpDeliveryError, type SmtpFailureCode } from '@/lib/smtp-client';

export class InvitationEmailError extends Error {
  readonly code: SmtpFailureCode;

  constructor(code: SmtpFailureCode) {
    super(code);
    this.name = 'InvitationEmailError';
    this.code = code;
  }
}

export function assertInvitationEmailConfigured(): void {
  try {
    readSmtpConfiguration();
  } catch {
    throw new InvitationEmailError('not_configured');
  }
}

export async function sendInvitationEmail(
  email: string,
  inviteUrl: string,
  deliveryId: string,
  personalMessage?: string
): Promise<string> {
  assertInvitationEmailConfigured();
  const content = buildInvitationEmail(inviteUrl, personalMessage);
  try {
    return await sendSmtpMessage({
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      deliveryId,
    });
  } catch (error) {
    if (error instanceof SmtpDeliveryError) throw new InvitationEmailError(error.code);
    throw new InvitationEmailError('send_failed');
  }
}
