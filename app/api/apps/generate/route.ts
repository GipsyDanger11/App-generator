import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { generateConfigFromPrompt, TEMPLATES } from '@/lib/mistral';
import { findTemplate } from '@/lib/config/templates';
import { parseConfig } from '@/lib/config/parser';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const prompt = String(body?.prompt ?? '').trim();
  const templateId = typeof body?.templateId === 'string' ? body.templateId : null;
  if (templateId) {
    const tpl = findTemplate(templateId);
    if (!tpl) return NextResponse.json({ error: 'Unknown template' }, { status: 404 });
    return NextResponse.json({ config: parseConfig(tpl.config) });
  }
  if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  const config = await generateConfigFromPrompt(prompt);
  return NextResponse.json({ config });
}

export async function GET() {
  return NextResponse.json({ templates: TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description, emoji: t.emoji })) });
}
