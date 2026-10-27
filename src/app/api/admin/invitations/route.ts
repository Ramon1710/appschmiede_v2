import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { createInvitationToken, hashInvitationEmail, normalizeInvitationEmail } from '@/lib/invitation-core';
import { enforceInvitationRateLimit, InvitationRateLimitError } from '@/lib/invitation-server';
import { assertInvitationEmailConfigured, InvitationEmailError, sendInvitationEmail } from '@/lib/invitation-email';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';
import { isRequestAuthError, requireAdminUid } from '@/lib/server-auth';
import { smtpFailureMessage } from '@/lib/smtp-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateInvitationResult =
  | { kind: 'created'; invitationId: string; email: string; expiresAt: Timestamp; url: string }
  | { kind: 'duplicate'; invitationId: string }
  | { kind: 'already-redeemed' };

function inviteUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://myappschmiede.com';
  const url = new URL('/invite', baseUrl);
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (process.env.NODE_ENV === 'production' ? url.protocol !== 'https:' || isLocalhost : url.protocol !== 'https:' && !isLocalhost) {
    throw new Error('invite URL must use HTTPS');
  }
  url.searchParams.set('token', token);
  return url.toString();
}

function responseError(error: unknown) {
  if (error instanceof InvitationRateLimitError) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte kurz und versuche es erneut.' }, { status: 429 });
  }
  if (error instanceof InvitationEmailError && error.code === 'not_configured') {
    return NextResponse.json({ error: smtpFailureMessage('not_configured') }, { status: 503 });
  }
  if (isRequestAuthError(error)) {
    return NextResponse.json({ error: 'Administratorzugriff erforderlich.' }, { status: 403 });
  }
  return NextResponse.json({ error: 'Einladung konnte nicht verarbeitet werden.' }, { status: 500 });
}

function invitationData(invitation: FirebaseFirestore.DocumentData) {
  const deliveryUpdatedAt = invitation.deliveryUpdatedAt instanceof Timestamp ? invitation.deliveryUpdatedAt : null;
  const deliveryStatus = invitation.deliveryStatus === 'sending' && deliveryUpdatedAt &&
    deliveryUpdatedAt.toMillis() < Date.now() - 5 * 60 * 1000
    ? 'unknown'
    : invitation.deliveryStatus ?? 'unknown';
  return {
    id: invitation.id,
    email: invitation.email,
    status: invitation.status,
    deliveryStatus,
    expiresAt: invitation.expiresAt instanceof Timestamp ? invitation.expiresAt.toDate().toISOString() : null,
    createdAt: invitation.createdAt instanceof Timestamp ? invitation.createdAt.toDate().toISOString() : null,
    sentAt: invitation.sentAt instanceof Timestamp ? invitation.sentAt.toDate().toISOString() : null,
    redeemedAt: invitation.redeemedAt instanceof Timestamp ? invitation.redeemedAt.toDate().toISOString() : null,
    createdByUid: invitation.createdByUid ?? null,
    createdByEmail: invitation.createdByEmail ?? null,
  };
}

async function createAndSendInvitation({
  email,
  adminUid,
  adminEmail,
  personalMessage,
  previousInvitationId,
}: {
  email: string;
  adminUid: string;
  adminEmail: string;
  personalMessage?: string;
  previousInvitationId?: string;
}) {
  assertInvitationEmailConfigured();

  const db = getFirebaseAdminDb();
  const invitationRef = db.collection('invitations').doc();
  const lockRef = db.collection('invitationEmailLocks').doc(hashInvitationEmail(email));
  const previousRef = previousInvitationId ? db.collection('invitations').doc(previousInvitationId) : null;
  const { token, tokenHash } = createInvitationToken();
  const url = inviteUrl(token);
  const expiresAt = Timestamp.fromMillis(Date.now() + 7 * DAY_MS);

  const result = await db.runTransaction<CreateInvitationResult>(async (transaction) => {
    const lockSnapshot = await transaction.get(lockRef);
    const previousSnapshot = previousRef ? await transaction.get(previousRef) : null;
    const matches = await transaction.get(db.collection('invitations').where('email', '==', email).limit(25));

    if (previousRef && (!previousSnapshot?.exists || previousSnapshot.get('email') !== email)) {
      return { kind: 'duplicate', invitationId: previousInvitationId! };
    }
    if (previousSnapshot?.exists && previousSnapshot.get('status') === 'redeemed') {
      return { kind: 'already-redeemed' };
    }
    if (previousSnapshot?.exists && !['pending', 'expired'].includes(previousSnapshot.get('status'))) {
      return { kind: 'duplicate', invitationId: previousInvitationId! };
    }

    const lockedInvitationId = lockSnapshot.get('invitationId');
    if (lockSnapshot.exists && typeof lockedInvitationId === 'string' && lockedInvitationId !== previousInvitationId) {
      const lockedInvitation = await transaction.get(db.collection('invitations').doc(lockedInvitationId));
      if (lockedInvitation.exists) {
        const lockedData = lockedInvitation.data()!;
        if (lockedData.status === 'redeemed') return { kind: 'already-redeemed' };
        if (lockedData.status === 'pending' && lockedData.expiresAt instanceof Timestamp && lockedData.expiresAt.toMillis() > Date.now()) {
          return { kind: 'duplicate', invitationId: lockedInvitationId };
        }
      }
    }

    for (const match of matches.docs) {
      if (match.id === previousInvitationId || match.id === lockedInvitationId) continue;
      const data = match.data();
      if (data.status === 'redeemed') return { kind: 'already-redeemed' };
      if (data.status === 'pending' && data.expiresAt instanceof Timestamp && data.expiresAt.toMillis() > Date.now()) {
        return { kind: 'duplicate', invitationId: match.id };
      }
    }

    if (previousSnapshot?.exists && previousSnapshot.get('status') === 'pending') {
      const previousExpiry = previousSnapshot.get('expiresAt');
      transaction.update(previousRef!, {
        status: previousExpiry instanceof Timestamp && previousExpiry.toMillis() <= Date.now() ? 'expired' : 'revoked',
        ...(previousExpiry instanceof Timestamp && previousExpiry.toMillis() <= Date.now()
          ? { expiredAt: FieldValue.serverTimestamp() }
          : { revokedAt: FieldValue.serverTimestamp(), revokedByUid: adminUid, supersededBy: invitationRef.id }),
      });
    }

    transaction.create(invitationRef, {
      email,
      tokenHash,
      status: 'pending',
      deliveryStatus: 'sending',
      expiresAt,
      createdByUid: adminUid,
      createdByEmail: adminEmail,
      createdAt: FieldValue.serverTimestamp(),
      sentAt: null,
      deliveryUpdatedAt: FieldValue.serverTimestamp(),
      providerMessageId: null,
      redeemedAt: null,
      redeemedByUid: null,
      redeemedEmail: null,
    });
    transaction.set(lockRef, {
      emailHash: hashInvitationEmail(email),
      invitationId: invitationRef.id,
      expiresAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { kind: 'created', invitationId: invitationRef.id, email, expiresAt, url };
  });

  if (result.kind !== 'created') return result;

  let providerMessageId: string;
  try {
    providerMessageId = await sendInvitationEmail(email, result.url, result.invitationId, personalMessage);
  } catch (error) {
    const deliveryErrorCode = error instanceof InvitationEmailError ? error.code : 'send_failed';
    await invitationRef.update({
      deliveryStatus: 'failed',
      deliveryErrorCode,
      deliveryUpdatedAt: FieldValue.serverTimestamp(),
    });
    return { ...result, deliveryStatus: 'failed' as const, deliveryErrorCode };
  }

  await invitationRef.update({
    deliveryStatus: 'sent',
    sentAt: FieldValue.serverTimestamp(),
    deliveryUpdatedAt: FieldValue.serverTimestamp(),
    providerMessageId,
  });
  return { ...result, deliveryStatus: 'sent' as const };
}

export async function GET(request: Request) {
  try {
    const adminUid = await requireAdminUid(request);
    await enforceInvitationRateLimit(request, 'admin-list', 60, adminUid);
    const snapshot = await getFirebaseAdminDb().collection('invitations').orderBy('createdAt', 'desc').limit(100).get();
    const now = Date.now();
    await Promise.all(snapshot.docs
      .filter((document) => {
        const data = document.data();
        return data.status === 'pending' && data.expiresAt instanceof Timestamp && data.expiresAt.toMillis() <= now;
      })
      .map((document) => getFirebaseAdminDb().runTransaction(async (transaction) => {
        const latest = await transaction.get(document.ref);
        const data = latest.data();
        if (latest.exists && data?.status === 'pending' && data.expiresAt instanceof Timestamp && data.expiresAt.toMillis() <= now) {
          transaction.update(document.ref, { status: 'expired', expiredAt: FieldValue.serverTimestamp() });
        }
      })));

    return NextResponse.json(
      {
        invitations: snapshot.docs.map((document) => {
          const data = document.data();
          return invitationData({
            id: document.id,
            ...data,
            status: data.status === 'pending' && data.expiresAt instanceof Timestamp && data.expiresAt.toMillis() <= now
              ? 'expired'
              : data.status,
          });
        }),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return responseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const adminUid = await requireAdminUid(request);
    await enforceInvitationRateLimit(request, 'admin-mail-minute', 5, adminUid);
    await enforceInvitationRateLimit(request, 'admin-mail-daily', 50, adminUid, DAY_MS);

    const body = await request.json().catch(() => ({}));
    const email = normalizeInvitationEmail(typeof body?.email === 'string' ? body.email : '');
    if (!emailPattern.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, { status: 400 });
    }
    const personalMessage = typeof body?.personalMessage === 'string' ? body.personalMessage.trim().slice(0, 500) : '';

    const adminProfile = await getFirebaseAdminDb().collection('users').doc(adminUid).get();
    const adminEmail = adminProfile.get('email');
    if (typeof adminEmail !== 'string') {
      return NextResponse.json({ error: 'Adminprofil konnte nicht geladen werden.' }, { status: 403 });
    }

    const result = await createAndSendInvitation({ email, adminUid, adminEmail, personalMessage });
    if (result.kind === 'duplicate') {
      return NextResponse.json({ error: 'Für diese Adresse besteht bereits eine aktive Einladung. Nutze „Erneut senden“.', code: 'active_invitation', invitationId: result.invitationId }, { status: 409 });
    }
    if (result.kind === 'already-redeemed') {
      return NextResponse.json({ error: 'Diese E-Mail-Adresse hat eine Einladung bereits angenommen.', code: 'already_redeemed' }, { status: 409 });
    }
    if (result.deliveryStatus === 'failed') {
      return NextResponse.json({ error: `Einladung angelegt. ${smtpFailureMessage(result.deliveryErrorCode)} Erneutes Senden ersetzt den bisherigen Link.`, invitationId: result.invitationId, deliveryStatus: 'failed' }, { status: 502 });
    }

    return NextResponse.json({ invitationId: result.invitationId, email: result.email, expiresAt: result.expiresAt.toDate().toISOString(), deliveryStatus: result.deliveryStatus }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return responseError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const adminUid = await requireAdminUid(request);
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const invitationId = typeof body?.invitationId === 'string' ? body.invitationId : '';
    if (!/^[A-Za-z0-9_-]{20}$/.test(invitationId)) {
      return NextResponse.json({ error: 'Einladung nicht gefunden.' }, { status: 404 });
    }

    if (action === 'resend') {
      await enforceInvitationRateLimit(request, 'admin-mail-minute', 5, adminUid);
      await enforceInvitationRateLimit(request, 'admin-mail-daily', 50, adminUid, DAY_MS);
      const adminProfile = await getFirebaseAdminDb().collection('users').doc(adminUid).get();
      const adminEmail = adminProfile.get('email');
      if (typeof adminEmail !== 'string') return NextResponse.json({ error: 'Adminprofil konnte nicht geladen werden.' }, { status: 403 });

      const personalMessage = typeof body?.personalMessage === 'string' ? body.personalMessage.trim().slice(0, 500) : '';
      const target = await getFirebaseAdminDb().collection('invitations').doc(invitationId).get();
      if (!target.exists || typeof target.get('email') !== 'string') return NextResponse.json({ error: 'Einladung nicht gefunden.' }, { status: 404 });
      const result = await createAndSendInvitation({
        email: target.get('email'),
        adminUid,
        adminEmail,
        personalMessage,
        previousInvitationId: invitationId,
      });
      if (result.kind === 'duplicate') return NextResponse.json({ error: 'Eine andere aktive Einladung besteht bereits.' }, { status: 409 });
      if (result.kind === 'already-redeemed') return NextResponse.json({ error: 'Die Einladung wurde bereits angenommen.' }, { status: 409 });
      if (result.deliveryStatus === 'failed') return NextResponse.json({ error: `Neue Einladung angelegt. ${smtpFailureMessage(result.deliveryErrorCode)} Der bisherige Link ist ungueltig.`, invitationId: result.invitationId, deliveryStatus: 'failed' }, { status: 502 });
      return NextResponse.json({ invitationId: result.invitationId, email: result.email, expiresAt: result.expiresAt.toDate().toISOString(), deliveryStatus: result.deliveryStatus }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    }

    if (action !== 'revoke') return NextResponse.json({ error: 'Aktion ungültig.' }, { status: 400 });
    await enforceInvitationRateLimit(request, 'admin-revoke', 30, adminUid);
    const db = getFirebaseAdminDb();
    const ref = db.collection('invitations').doc(invitationId);
    const outcome = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return 'invalid';
      const data = snapshot.data()!;
      if (data.status !== 'pending') return data.status;
      if (!(data.expiresAt instanceof Timestamp) || data.expiresAt.toMillis() <= Date.now()) {
        transaction.update(ref, { status: 'expired', expiredAt: FieldValue.serverTimestamp() });
        return 'expired';
      }
      transaction.update(ref, { status: 'revoked', revokedAt: FieldValue.serverTimestamp(), revokedByUid: adminUid });
      return 'revoked';
    });

    if (outcome !== 'revoked') {
      return NextResponse.json({ error: outcome === 'invalid' ? 'Einladung nicht gefunden.' : 'Diese Einladung ist nicht mehr ausstehend.' }, { status: outcome === 'invalid' ? 404 : 409 });
    }
    return NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return responseError(error);
  }
}
