// DEBUG ONLY — returns the raw AI output + the parsed config so you can
// see exactly what went wrong. Remove or protect this in production.
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const prompt = String(body?.prompt ?? '').trim();
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  const provider = (process.env.AI_PROVIDER ?? 'groq').toLowerCase();
  const groqKey = process.env.GROQ_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  const results: Record<string, unknown> = { prompt, provider };

  // Try Groq
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Output ONLY a JSON object for a metadata-driven app config with name, entities, pages.' },
            { role: 'user', content: `Build a CRM app with Customer and Deal entities. Include hero page, stats page, table pages, and form pages.` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });
      const status = res.status;
      const text = await res.text();
      let parsed: unknown = null;
      try { parsed = JSON.parse(text); } catch {}
      results.groq = { status, responseText: text.slice(0, 2000), parsed };
    } catch (e) {
      results.groq = { error: String(e) };
    }
  } else {
    results.groq = 'no key';
  }

  // Try Mistral
  if (mistralKey) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${mistralKey}` },
        body: JSON.stringify({
          model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
          messages: [
            { role: 'system', content: 'Output ONLY a JSON object for a metadata-driven app config with name, entities, pages.' },
            { role: 'user', content: `Build a CRM app with Customer and Deal entities. Include hero page, stats page, table pages, and form pages.` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });
      const status = res.status;
      const text = await res.text();
      let parsed: unknown = null;
      try { parsed = JSON.parse(text); } catch {}
      results.mistral = { status, responseText: text.slice(0, 2000), parsed };
    } catch (e) {
      results.mistral = { error: String(e) };
    }
  } else {
    results.mistral = 'no key';
  }

  return NextResponse.json(results, { status: 200 });
}
