import { NextResponse } from 'next/server';
import { isRequestAuthError, requireAuthenticatedUid } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAuthenticatedUid(request);
    return NextResponse.json({ authorized: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (isRequestAuthError(error)) {
      return NextResponse.json({ authorized: false }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ error: 'Zugangsstatus konnte nicht geprüft werden.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
