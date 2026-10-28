import { NextResponse } from 'next/server';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebase-admin';
import {
  APP_SESSION_COOKIE,
  isRequestAuthError,
  requireAuthenticatedIdentity,
  requireAuthenticatedUid,
} from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deletionResponse(body: object, status: number) {
  const response = NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(APP_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function DELETE(request: Request) {
  try {
    const uid = await requireAuthenticatedUid(request);
    const identity = await requireAuthenticatedIdentity(request);
    const age = Date.now() / 1000 - identity.auth_time;
    if (identity.uid !== uid || !Number.isFinite(age) || age < 0 || age > 300) {
      return NextResponse.json(
        { error: 'Bitte melde dich erneut an, bevor du dein Konto löschst.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Eine ausdrückliche Löschbestätigung ist erforderlich.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || !('confirmed' in body) || body.confirmed !== true) {
      return NextResponse.json({ error: 'Eine ausdrückliche Löschbestätigung ist erforderlich.' }, { status: 400 });
    }

    await getFirebaseAdminAuth().deleteUser(uid);
    try {
      await getFirebaseAdminDb().collection('users').doc(uid).delete();
    } catch {
      console.error('Account deletion: Firebase account deleted, but profile cleanup failed.');
      return deletionResponse({
        accountDeleted: true,
        error: 'Dein Firebase-Konto wurde gelöscht, aber die Profildaten konnten nicht entfernt werden. Bitte wende dich an die Administration.',
      }, 500);
    }
    return deletionResponse({ accountDeleted: true }, 200);
  } catch (error) {
    if (isRequestAuthError(error)) {
      return NextResponse.json({ error: 'Eine Anmeldung mit freigeschaltetem Zugang ist erforderlich.' }, { status: 401 });
    }
    console.error('Account deletion failed before completion.');
    return NextResponse.json({ error: 'Dein Konto konnte nicht gelöscht werden. Bitte versuche es erneut.' }, { status: 500 });
  }
}
