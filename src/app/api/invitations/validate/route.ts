import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { checkInvitation, hashInvitationToken, type InvitationStatus } from '@/lib/invitation-core';
import { enforceInvitationRateLimit, InvitationRateLimitError } from '@/lib/invitation-server';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const messages = {
  invalid: 'Dieser Einladungslink ist ungültig.',
  expired: 'Diese Einladung ist abgelaufen. Bitte den Administrator um einen neuen Link.',
  redeemed: 'Diese Einladung wurde bereits verwendet.',
  revoked: 'Diese Einladung wurde widerrufen.',
  'email-mismatch': 'Das Konto gehört nicht zur eingeladenen E-Mail-Adresse.',
} as const;

function failureStatus(reason: keyof typeof messages): number {
  return reason === 'invalid' ? 404 : reason === 'email-mismatch' ? 403 : 410;
}

export async function POST(request: Request) {
  try {
    await enforceInvitationRateLimit(request, 'validate', 20);
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token : '';
    const tokenHash = hashInvitationToken(token);
    if (!tokenHash) {
      return NextResponse.json({ error: messages.invalid, code: 'invalid' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }

    const db = getFirebaseAdminDb();
    const inviteQuery = db.collection('invitations').where('tokenHash', '==', tokenHash).limit(1);
    const result = await db.runTransaction(async (transaction) => {
      const matches = await transaction.get(inviteQuery);
      if (matches.empty) return { ok: false as const, reason: 'invalid' as const };

      const invitation = matches.docs[0];
      const data = invitation.data();
      const validStatus = ['pending', 'redeemed', 'expired', 'revoked'].includes(data.status);
      const expiry = data.expiresAt;
      if (
        !validStatus ||
        typeof data.email !== 'string' ||
        !(expiry instanceof Timestamp)
      ) {
        return { ok: false as const, reason: 'invalid' as const };
      }

      const check = checkInvitation(
        { email: data.email, status: data.status as InvitationStatus, expiresAt: expiry.toMillis() },
        Date.now()
      );
      if (!check.ok && check.reason === 'expired' && data.status === 'pending') {
        transaction.update(invitation.ref, {
          status: 'expired',
          expiredAt: FieldValue.serverTimestamp(),
        });
      }
      return check.ok
        ? { ...check, expiresAt: expiry.toDate().toISOString() }
        : check;
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: messages[result.reason], code: result.reason },
        { status: failureStatus(result.reason), headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { email: result.email, expiresAt: result.expiresAt },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof InvitationRateLimitError) {
      return NextResponse.json({ error: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ error: 'Einladung konnte nicht geprüft werden.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
