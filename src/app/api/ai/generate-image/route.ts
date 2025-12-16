import { NextResponse } from 'next/server';

const PROVIDER_URL = 'https://image.pollinations.ai/prompt/';
const MAX_PROMPT_LENGTH = 180;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const buildProviderUrl = (prompt: string) => {
  const url = new URL(`${PROVIDER_URL}${encodeURIComponent(prompt)}`);
  url.searchParams.set('n', '1');
  url.searchParams.set('size', '768x768');
  url.searchParams.set('background', 'transparent');
  return url.toString();
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return NextResponse.json({ error: 'Bitte gib eine Bildbeschreibung ein.' }, { status: 400 });
    }

    const safePrompt = prompt.slice(0, MAX_PROMPT_LENGTH);

    // Prefer OpenAI if key is available
    if (OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: safePrompt,
            size: '1024x1024',
            response_format: 'b64_json',
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('OpenAI image error', errText);
          throw new Error('OpenAI image generation failed');
        }

        const json = (await response.json()) as any;
        const base64 = json?.data?.[0]?.b64_json;
        if (typeof base64 === 'string' && base64.length > 0) {
          return NextResponse.json({ dataUrl: `data:image/png;base64,${base64}` });
        }
      } catch (error) {
        console.warn('Falling back to pollinations image provider', error);
      }
    }

    // Fallback provider
    const providerUrl = buildProviderUrl(safePrompt);
    const response = await fetch(providerUrl, {
      cache: 'no-store',
      headers: { Accept: 'image/png' },
    });

    if (!response.ok) {
      console.error('Image provider error', await response.text());
      return NextResponse.json({ error: 'Der Bilddienst konnte kein Ergebnis liefern.' }, { status: response.status });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    return NextResponse.json({ dataUrl });
  } catch (error) {
    console.error('AI image generation failed', error);
    return NextResponse.json({ error: 'KI Bild konnte nicht erzeugt werden.' }, { status: 500 });
  }
}
