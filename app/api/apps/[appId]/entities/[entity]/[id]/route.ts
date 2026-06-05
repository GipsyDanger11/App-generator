// Single record: GET / PATCH / DELETE
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findEntity, loadApp } from '@/lib/appLoader';
import { buildEntityZodSchema } from '@/lib/config/parser';
import { runWorkflows } from '@/lib/workflows';
import { jsonInput } from '@/lib/jsonInput';

async function loadRecord(appId: string, entityName: string, id: string) {
  const rec = await prisma.record.findUnique({ where: { id } });
  if (!rec || rec.appId !== appId || rec.entityName.toLowerCase() !== entityName.toLowerCase()) return null;
  return rec;
}

export async function GET(_req: Request, { params }: { params: { appId: string; entity: string; id: string } }) {
  const r = await loadApp(params.appId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, params.entity);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const rec = await loadRecord(params.appId, entity.name, params.id);
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rec);
}

export async function PATCH(req: Request, { params }: { params: { appId: string; entity: string; id: string } }) {
  const r = await loadApp(params.appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, params.entity);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const existing = await loadRecord(params.appId, entity.name, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const merged = { ...(existing.data as Record<string, unknown>), ...(body ?? {}) };
  const validate = buildEntityZodSchema(entity);
  const result = validate(merged);
  if (!result.ok) return NextResponse.json({ error: 'Validation failed', fieldErrors: result.errors }, { status: 422 });
  const rec = await prisma.record.update({ where: { id: params.id }, data: { data: jsonInput(result.clean) } });
  void runWorkflows({ appId: params.appId, appConfig: r.config, ownerId: r.user.id, triggerEntity: entity.name, triggerEvent: 'update', record: { id: rec.id, ...(result.clean as object) } });
  return NextResponse.json(rec);
}

export async function DELETE(_req: Request, { params }: { params: { appId: string; entity: string; id: string } }) {
  const r = await loadApp(params.appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, params.entity);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const existing = await loadRecord(params.appId, entity.name, params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.record.delete({ where: { id: params.id } });
  void runWorkflows({ appId: params.appId, appConfig: r.config, ownerId: r.user.id, triggerEntity: entity.name, triggerEvent: 'delete', record: { id: params.id, ...((existing.data as Record<string, unknown>) ?? {}) } });
  return NextResponse.json({ ok: true });
}
