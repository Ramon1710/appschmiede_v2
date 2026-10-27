import { NextResponse } from 'next/server';
import { APP_SESSION_COOKIE, attachAppSessionCookie, createAppSessionCookie, isRequestAuthError, requireAuthenticatedUid } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUid(request);
    const authorization = request.headers.get('authorization') ?? '';
    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (!token) return NextResponse.json({ error: 'Anmeldung erforderlich.' }, { status: 401 });

    const sessionCookie = await createAppSessionCookie(token);
    const response = NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    attachAppSessionCookie(response, sessionCookie);
    return response;
  } catch (error) {
    if (isRequestAuthError(error)) {
      return NextResponse.json({ error: 'Kein freigeschalteter AppSchmiede-Zugang.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Sitzung konnte nicht eingerichtet werden.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(APP_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
