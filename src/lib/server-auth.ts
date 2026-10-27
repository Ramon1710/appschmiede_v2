import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebase-admin';

export const APP_SESSION_COOKIE = '__session';
export const APP_SESSION_LIFETIME_MS = 5 * 24 * 60 * 60 * 1000;

export async function createAppSessionCookie(idToken: string): Promise<string> {
  return getFirebaseAdminAuth().createSessionCookie(idToken, { expiresIn: APP_SESSION_LIFETIME_MS });
}

export function attachAppSessionCookie(response: NextResponse, sessionCookie: string): void {
  response.cookies.set(APP_SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(APP_SESSION_LIFETIME_MS / 1000),
  });
}

export class RequestAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestAuthError';
  }
}

export function isRequestAuthError(error: unknown): error is RequestAuthError {
  return error instanceof RequestAuthError;
}

async function hasAdminRole(uid: string): Promise<boolean> {
  const profile = await getFirebaseAdminDb().collection('users').doc(uid).get();
  return profile.exists && profile.get('role') === 'admin';
}

function readBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

async function verifyIdentity(request: Request) {
  const token = readBearerToken(request);
  if (!token) throw new RequestAuthError('authorization token missing');

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token, true);
    if (!decoded.uid || typeof decoded.email !== 'string') {
      throw new RequestAuthError('invalid auth token');
    }
    return decoded;
  } catch (error) {
    if (isRequestAuthError(error)) throw error;
    throw new RequestAuthError('invalid auth token');
  }
}

export async function requireAuthenticatedIdentity(request: Request) {
  return verifyIdentity(request);
}

export async function requireVerifiedIdentity(request: Request) {
  const decoded = await requireAuthenticatedIdentity(request);
  if (decoded.email_verified !== true) throw new RequestAuthError('verified email required');
  return decoded;
}

export async function requireAuthenticatedUid(request: Request): Promise<string> {
  const decoded = await requireAuthenticatedIdentity(request);
  const email = decoded.email!.trim().toLowerCase();
  if (await hasAdminRole(decoded.uid)) return decoded.uid;

  const grant = await getFirebaseAdminDb().collection('accessGrants').doc(decoded.uid).get();
  const grantedEmail = grant.get('email');
  if (
    !grant.exists ||
    grant.get('status') !== 'active' ||
    typeof grantedEmail !== 'string' ||
    grantedEmail.trim().toLowerCase() !== email
  ) {
    throw new RequestAuthError('app access not granted');
  }

  return decoded.uid;
}

export async function requireAdminUid(request: Request): Promise<string> {
  const decoded = await verifyIdentity(request);
  if (!(await hasAdminRole(decoded.uid))) {
    throw new RequestAuthError('administrator access required');
  }
  return decoded.uid;
}

export async function requireServerAccess(): Promise<string> {
  const sessionCookie = (await cookies()).get(APP_SESSION_COOKIE)?.value;
  if (!sessionCookie) redirect('/login');

  let decoded;
  try {
    decoded = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/login');
  }

  if (!decoded.uid || typeof decoded.email !== 'string') redirect('/login');
  const email = decoded.email.trim().toLowerCase();
  if (await hasAdminRole(decoded.uid)) return decoded.uid;

  const grant = await getFirebaseAdminDb().collection('accessGrants').doc(decoded.uid).get();
  const grantedEmail = grant.get('email');
  if (
    !grant.exists ||
    grant.get('status') !== 'active' ||
    typeof grantedEmail !== 'string' ||
    grantedEmail.trim().toLowerCase() !== email
  ) {
    redirect('/login');
  }

  return decoded.uid;
}

export async function requireServerAdminAccess(): Promise<string> {
  const sessionCookie = (await cookies()).get(APP_SESSION_COOKIE)?.value;
  if (!sessionCookie) redirect('/login');

  let decoded;
  try {
    decoded = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/login');
  }

  if (!decoded.uid) redirect('/login');
  if (!(await hasAdminRole(decoded.uid))) redirect('/dashboard');
  return decoded.uid;
}
