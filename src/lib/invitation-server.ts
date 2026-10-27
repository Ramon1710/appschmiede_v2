import 'server-only';

import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';

const RATE_WINDOW_MS = 60_000;

export class InvitationRateLimitError extends Error {
  constructor() {
    super('invitation rate limit exceeded');
    this.name = 'InvitationRateLimitError';
  }
}

function requestAddress(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 128);

  const forwardedFor = request.headers.get('x-forwarded-for');
  const address = forwardedFor?.split(',').at(-1)?.trim();
  return address ? address.slice(0, 128) : 'unknown';
}

export async function enforceInvitationRateLimit(
  request: Request,
  action: string,
  maximum: number,
  scope?: string,
  windowMs = RATE_WINDOW_MS
): Promise<void> {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const addressHash = createHash('sha256')
    .update(`${action}\0${scope ?? requestAddress(request)}`)
    .digest('hex');
  const ref = getFirebaseAdminDb()
    .collection('invitationRateLimits')
    .doc(`${addressHash}_${window}`);

  await getFirebaseAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const count = snapshot.exists ? Number(snapshot.get('count') ?? 0) : 0;
    if (count >= maximum) throw new InvitationRateLimitError();

    transaction.set(ref, {
      count: count + 1,
      expiresAt: Timestamp.fromMillis((window + 2) * windowMs),
    });
  });
}
