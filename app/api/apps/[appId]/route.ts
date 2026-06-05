import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loadApp } from '@/lib/appLoader';
import { parseConfig } from '@/lib/config/parser';
import { jsonInput } from '@/lib/jsonInput';

export async function GET(_req: Request, { params }: { params: { appId: string } }) {
  const r = await loadApp(params.appId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({
    id: r.app.id, name: r.app.name, slug: r.app.slug, description: r.app.description,
    config: r.config, defaultLocale: r.app.defaultLocale, supportedLocales: r.app.supportedLocales,
  });
}

export async function PATCH(req: Request, { params }: { params: { appId: string } }) {
  const r = await loadApp(params.appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const data: any = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.description === 'string') data.description = body.description;
  if (body.config !== undefined) data.config = jsonInput(parseConfig(body.config));
  if (Array.isArray(body.supportedLocales)) data.supportedLocales = body.supportedLocales.map(String);
  if (typeof body.defaultLocale === 'string') data.defaultLocale = body.defaultLocale;
  const app = await prisma.app.update({ where: { id: params.appId }, data });
  return NextResponse.json({ id: app.id, slug: app.slug });
}

export async function DELETE(_req: Request, { params }: { params: { appId: string } }) {
  const r = await loadApp(params.appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  await prisma.app.delete({ where: { id: params.appId } });
  return NextResponse.json({ ok: true });
}
