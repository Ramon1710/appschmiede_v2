import 'server-only';

import { getFirebaseAdminAuth } from '@/lib/firebase-admin';

export class RequestAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestAuthError';
  }
}

export function isRequestAuthError(error: unknown): error is RequestAuthError {
  return error instanceof RequestAuthError;
}

function readBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function requireAuthenticatedUid(request: Request): Promise<string> {
  const token = readBearerToken(request);
  if (!token) {
    throw new RequestAuthError('authorization token missing');
  }

  const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
  if (!decoded?.uid) {
    throw new RequestAuthError('invalid auth token');
  }

  return decoded.uid;
}