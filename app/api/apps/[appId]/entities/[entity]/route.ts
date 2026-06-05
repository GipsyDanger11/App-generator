// Dynamic entity CRUD: list + create.
// [entity] is matched against the app's config; unknown entities 404.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findEntity, loadApp } from '@/lib/appLoader';
import { buildEntityZodSchema } from '@/lib/config/parser';
import { runWorkflows } from '@/lib/workflows';
import { jsonInput } from '@/lib/jsonInput';

export async function GET(_req: Request, { params }: { params: { appId: string; entity: string } }) {
  const r = await loadApp(params.appId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, params.entity);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  const records = await prisma.record.findMany({
    where: { appId: params.appId, entityName: entity.name },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request, { params }: { params: { appId: string; entity: string } }) {
  const r = await loadApp(params.appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, params.entity);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const validate = buildEntityZodSchema(entity);
  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: result.errors }, { status: 422 });
  }
  try {
    const record = await prisma.record.create({
      data: { appId: params.appId, entityName: entity.name, data: jsonInput(result.clean), createdBy: r.user.id },
    });
    // Run create workflows (fire-and-forget)
    void runWorkflows({ appId: params.appId, appConfig: r.config, ownerId: r.user.id, triggerEntity: entity.name, triggerEvent: 'create', record: { id: record.id, ...(result.clean as object) } });
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create record', details: (e as Error).message }, { status: 500 });
  }
}
