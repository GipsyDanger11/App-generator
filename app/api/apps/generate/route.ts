import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { generateConfigFromPrompt } from '@/lib/mistral';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const prompt = String(body?.prompt ?? '').trim();
  if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  const config = await generateConfigFromPrompt(prompt);
  return NextResponse.json({ config });
}
