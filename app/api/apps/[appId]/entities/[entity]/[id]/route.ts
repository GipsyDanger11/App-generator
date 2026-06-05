// Single record: GET / PATCH / DELETE
import { NextResponse } from 'next/server';
import { prisma, dbRetry } from '@/lib/prisma';
import { findEntity, loadApp } from '@/lib/appLoader';
import { buildEntityZodSchema } from '@/lib/config/parser';
import { runWorkflows } from '@/lib/workflows';
import { jsonInput } from '@/lib/jsonInput';
import { unwrapParams, pickString } from '@/lib/routeParams';

async function loadRecord(appId: string, entityName: string, id: string) {
  if (!id) return null;
  const rec = await dbRetry(() => prisma.record.findUnique({ where: { id } }));
  if (!rec || rec.appId !== appId || rec.entityName.toLowerCase() !== entityName.toLowerCase()) return null;
  return rec;
}

export async function GET(_req: Request, ctx: { params: { appId: string; entity: string; id: string } | Promise<{ appId: string; entity: string; id: string }> }) {
  const params = await unwrapParams(ctx.params);
  const appId = pickString(params, 'appId');
  const entityName = pickString(params, 'entity');
  const id = pickString(params, 'id');
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  const r = await loadApp(appId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, entityName);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const rec = await loadRecord(appId, entity.name, id);
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rec);
}

export async function PATCH(req: Request, ctx: { params: { appId: string; entity: string; id: string } | Promise<{ appId: string; entity: string; id: string }> }) {
  const params = await unwrapParams(ctx.params);
  const appId = pickString(params, 'appId');
  const entityName = pickString(params, 'entity');
  const id = pickString(params, 'id');
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  const r = await loadApp(appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, entityName);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const existing = await loadRecord(appId, entity.name, id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const merged = { ...(existing.data as Record<string, unknown>), ...(body ?? {}) };
  const validate = buildEntityZodSchema(entity);
  const result = validate(merged);
  if (!result.ok) return NextResponse.json({ error: 'Validation failed', fieldErrors: result.errors }, { status: 422 });
  try {
    const rec = await dbRetry(() =>
      prisma.record.update({ where: { id }, data: { data: jsonInput(result.clean) } })
    );
    void runWorkflows({ appId, appConfig: r.config, ownerId: r.user.id, triggerEntity: entity.name, triggerEvent: 'update', record: { id: rec.id, ...(result.clean as object) } });
    return NextResponse.json(rec);
  } catch (e) {
    return NextResponse.json({ error: 'Update failed', details: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: { appId: string; entity: string; id: string } | Promise<{ appId: string; entity: string; id: string }> }) {
  const params = await unwrapParams(ctx.params);
  const appId = pickString(params, 'appId');
  const entityName = pickString(params, 'entity');
  const id = pickString(params, 'id');
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  const r = await loadApp(appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, entityName);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const existing = await loadRecord(appId, entity.name, id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    await dbRetry(() => prisma.record.delete({ where: { id } }));
    void runWorkflows({ appId, appConfig: r.config, ownerId: r.user.id, triggerEntity: entity.name, triggerEvent: 'delete', record: { id, ...((existing.data as Record<string, unknown>) ?? {}) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Delete failed', details: (e as Error).message }, { status: 500 });
  }
}
