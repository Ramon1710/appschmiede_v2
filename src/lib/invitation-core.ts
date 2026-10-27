import { createHash, randomBytes } from 'node:crypto';

export type InvitationStatus = 'pending' | 'redeemed' | 'expired' | 'revoked';
export type InvitationFailure = 'invalid' | 'expired' | 'redeemed' | 'revoked' | 'email-mismatch';

export type InvitationCheck =
  | { ok: true; email: string }
  | { ok: false; reason: InvitationFailure };

export type InvitationRecord = {
  email: string;
  status: InvitationStatus;
  expiresAt: number;
};

export function normalizeInvitationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashInvitationEmail(email: string): string {
  return createHash('sha256').update(normalizeInvitationEmail(email), 'utf8').digest('hex');
}

export function createInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashInvitationToken(token)! };
}

export function hashInvitationToken(token: string): string | null {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function checkInvitation(
  invitation: InvitationRecord | null,
  now: number,
  verifiedEmail?: string
): InvitationCheck {
  if (!invitation) return { ok: false, reason: 'invalid' };
  if (invitation.status === 'revoked') return { ok: false, reason: 'revoked' };
  if (invitation.status === 'redeemed') return { ok: false, reason: 'redeemed' };
  if (invitation.status === 'expired' || invitation.expiresAt <= now) {
    return { ok: false, reason: 'expired' };
  }
  if (verifiedEmail && normalizeInvitationEmail(verifiedEmail) !== invitation.email) {
    return { ok: false, reason: 'email-mismatch' };
  }
  return { ok: true, email: invitation.email };
}
