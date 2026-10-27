import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { checkInvitation, hashInvitationToken, normalizeInvitationEmail, type InvitationStatus } from '@/lib/invitation-core';
import { enforceInvitationRateLimit, InvitationRateLimitError } from '@/lib/invitation-server';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebase-admin';
import { attachAppSessionCookie, createAppSessionCookie, isRequestAuthError, requireAuthenticatedIdentity } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const messages = {
  invalid: 'Dieser Einladungslink ist ungültig.',
  expired: 'Diese Einladung ist abgelaufen. Bitte den Administrator um einen neuen Link.',
  redeemed: 'Diese Einladung wurde bereits verwendet.',
  revoked: 'Diese Einladung wurde widerrufen.',
  'email-mismatch': 'Die verifizierte E-Mail-Adresse stimmt nicht mit der Einladung überein.',
} as const;

function failureStatus(reason: keyof typeof messages): number {
  return reason === 'invalid' ? 404 : reason === 'email-mismatch' ? 403 : 410;
}

export async function POST(request: Request) {
  try {
    await enforceInvitationRateLimit(request, 'redeem', 10);
    const identity = await requireAuthenticatedIdentity(request);
    const authUser = await getFirebaseAdminAuth().getUser(identity.uid);
    const email = normalizeInvitationEmail(identity.email!);
    if (
      authUser.disabled ||
      !authUser.email ||
      normalizeInvitationEmail(authUser.email) !== email
    ) {
      return NextResponse.json({ error: 'Das Firebase-Konto stimmt nicht mit der eingeladenen E-Mail-Adresse überein.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
    const storedEmail = authUser.email.trim();

    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token : '';
    const tokenHash = hashInvitationToken(token);
    if (!tokenHash) {
      return NextResponse.json({ error: messages.invalid, code: 'invalid' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }

    const displayName = typeof body?.displayName === 'string' ? body.displayName.trim().slice(0, 120) : '';
    const db = getFirebaseAdminDb();
    const invitationQuery = db.collection('invitations').where('tokenHash', '==', tokenHash).limit(1);
    const result = await db.runTransaction(async (transaction) => {
      const matches = await transaction.get(invitationQuery);
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
        Date.now(),
        email
      );
      if (!check.ok) {
        if (check.reason === 'expired' && data.status === 'pending') {
          transaction.update(invitation.ref, {
            status: 'expired',
            expiredAt: FieldValue.serverTimestamp(),
          });
        }
        return check;
      }

      const grantRef = db.collection('accessGrants').doc(identity.uid);
      const profileRef = db.collection('users').doc(identity.uid);
      const [grantSnapshot, profileSnapshot] = await Promise.all([
        transaction.get(grantRef),
        transaction.get(profileRef),
      ]);

      transaction.update(invitation.ref, {
        status: 'redeemed',
        redeemedAt: FieldValue.serverTimestamp(),
        redeemedByUid: identity.uid,
        redeemedEmail: email,
      });
      transaction.set(grantRef, {
        uid: identity.uid,
        email: storedEmail,
        status: 'active',
        source: 'invitation',
        invitationId: invitation.id,
        createdAt: grantSnapshot.exists ? grantSnapshot.get('createdAt') : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdByUid: data.createdByUid,
        createdByEmail: data.createdByEmail,
      }, { merge: true });

      if (!profileSnapshot.exists) {
        transaction.create(profileRef, {
          email: storedEmail,
          displayName: displayName || authUser.displayName || null,
          company: null,
          plan: 'free',
          planStatus: 'trialing',
          coinsBalance: 30,
          role: 'user',
          subscriptionRenewsAt: null,
          billingMethod: null,
          planSince: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          onboarding: { welcomeTourPending: true },
        });
      } else {
        transaction.update(profileRef, {
          email: storedEmail,
          ...(displayName ? { displayName } : {}),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return { ok: true as const, uid: identity.uid };
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: messages[result.reason], code: result.reason },
        { status: failureStatus(result.reason), headers: { 'Cache-Control': 'no-store' } }
      );
    }

    let emailVerified = authUser.emailVerified;
    if (!emailVerified) {
      try {
        await getFirebaseAdminAuth().updateUser(identity.uid, { emailVerified: true });
        emailVerified = true;
      } catch {
        console.error('Firebase emailVerified could not be updated after successful invitation redemption.');
      }
    }

    const authorization = request.headers.get('authorization') ?? '';
    const idToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (!idToken) {
      return NextResponse.json({ error: 'Sitzung konnte nicht eingerichtet werden.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    const sessionCookie = await createAppSessionCookie(idToken);
    const response = NextResponse.json({ ok: true, emailVerified }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    attachAppSessionCookie(response, sessionCookie);
    return response;
  } catch (error) {
    if (error instanceof InvitationRateLimitError) {
      return NextResponse.json({ error: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    }
    if (isRequestAuthError(error)) {
      return NextResponse.json({ error: 'Bitte melde dich mit einer verifizierten E-Mail-Adresse an.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ error: 'Einladung konnte nicht eingelöst werden.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
