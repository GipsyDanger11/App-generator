import { NextResponse } from 'next/server';
import { prisma, dbRetry } from '@/lib/prisma';
import { loadApp } from '@/lib/appLoader';
import { parseConfig } from '@/lib/config/parser';
import { jsonInput } from '@/lib/jsonInput';
import { unwrapParams, pickString } from '@/lib/routeParams';

export async function GET(_req: Request, ctx: { params: { appId: string } | Promise<{ appId: string }> }) {
  const params = await unwrapParams(ctx.params);
  const appId = pickString(params, 'appId');
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  const r = await loadApp(appId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({
    id: r.app.id, name: r.app.name, slug: r.app.slug, description: r.app.description,
    config: r.config, defaultLocale: r.app.defaultLocale, supportedLocales: r.app.supportedLocales,
  });
}

export async function PATCH(req: Request, ctx: { params: { appId: string } | Promise<{ appId: string }> }) {
  const params = await unwrapParams(ctx.params);
  const appId = pickString(params, 'appId');
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  const r = await loadApp(appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const data: any = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.description === 'string') data.description = body.description;
  if (body.config !== undefined) data.config = jsonInput(parseConfig(body.config));
  if (Array.isArray(body.supportedLocales)) data.supportedLocales = body.supportedLocales.map(String);
  if (typeof body.defaultLocale === 'string') data.defaultLocale = body.defaultLocale;
  try {
    const app = await dbRetry(() => prisma.app.update({ where: { id: appId }, data }));
    return NextResponse.json({ id: app.id, slug: app.slug });
  } catch (e) {
    return NextResponse.json({ error: 'Update failed', details: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: { appId: string } | Promise<{ appId: string }> }) {
  const params = await unwrapParams(ctx.params);
  const appId = pickString(params, 'appId');
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  const r = await loadApp(appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  try {
    await dbRetry(() => prisma.app.delete({ where: { id: appId } }));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Delete failed', details: (e as Error).message }, { status: 500 });
  }
}
