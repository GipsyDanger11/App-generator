// Live translation endpoint: translates a key+text into a target locale
// using Mistral. Used by the generated app to fill missing keys.
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const text = String(body?.text ?? '').trim();
  const to = String(body?.to ?? 'en');
  if (!text) return NextResponse.json({ translation: '' });
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return NextResponse.json({ translation: text });
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
        messages: [
          { role: 'system', content: 'You are a translator. Translate the user text into the target locale. Reply with ONLY the translation, no quotes, no commentary.' },
          { role: 'user', content: `Target locale: ${to}\n\nText:\n${text}` },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) return NextResponse.json({ translation: text });
    const j: any = await res.json();
    const t = j.choices?.[0]?.message?.content?.toString().trim() ?? text;
    return NextResponse.json({ translation: t });
  } catch {
    return NextResponse.json({ translation: text });
  }
}
