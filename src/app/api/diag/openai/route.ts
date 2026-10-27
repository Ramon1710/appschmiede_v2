import { NextResponse } from 'next/server';
import { isRequestAuthError, requireAdminUid } from '@/lib/server-auth';

export const runtime = 'nodejs';

function getOpenAiApiKey() {
  const candidates: Array<[string, string | undefined]> = [
    ['OPENAI_API_KEY', process.env.OPENAI_API_KEY],
    ['OPENAI_KEY', process.env.OPENAI_KEY],
    ['OPENAI_TOKEN', process.env.OPENAI_TOKEN],
    ['OPENAI_APIKEY', (process.env as Record<string, string | undefined>).OPENAI_APIKEY],
  ];

  for (const [name, value] of candidates) {
    const key = (value ?? '').trim();
    if (key) {
      return { hasKey: true, source: name };
    }
  }

  return { hasKey: false, source: null as string | null };
}

export async function GET(request: Request) {
  try {
    await requireAdminUid(request);
  } catch (error) {
    if (isRequestAuthError(error)) {
      return NextResponse.json({ error: 'Administratoranmeldung erforderlich.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Diagnose nicht verfügbar.' }, { status: 500 });
  }

  const openAi = getOpenAiApiKey();

  return NextResponse.json(
    {
      ok: true,
      runtime: 'nodejs',
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      openAi,
    },
    { status: 200 }
  );
}