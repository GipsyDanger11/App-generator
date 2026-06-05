// Dynamic entity CRUD: list + create.
// [entity] is matched against the app's config; unknown entities 404.
import { NextResponse } from 'next/server';
import { prisma, dbRetry } from '@/lib/prisma';
import { findEntity, loadApp } from '@/lib/appLoader';
import { buildEntityZodSchema } from '@/lib/config/parser';
import { runWorkflows } from '@/lib/workflows';
import { jsonInput } from '@/lib/jsonInput';
import { unwrapParams, pickString } from '@/lib/routeParams';

export async function GET(req: Request, ctx: { params: { appId: string; entity: string } | Promise<{ appId: string; entity: string }> }) {
  const params = await unwrapParams(ctx.params);
  const appId = pickString(params, 'appId');
  const entityName = pickString(params, 'entity');
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  const r = await loadApp(appId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, entityName);
  if (!entity) return NextResponse.json({ records: [] });
  try {
    const records = await dbRetry(() =>
      prisma.record.findMany({
        where: { appId, entityName: entity.name },
        orderBy: { createdAt: 'desc' },
      })
    );
    return NextResponse.json(records);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list records', details: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: { appId: string; entity: string } | Promise<{ appId: string; entity: string }> }) {
  const params = await unwrapParams(ctx.params);
  const appId = pickString(params, 'appId');
  const entityName = pickString(params, 'entity');
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  const r = await loadApp(appId, { requireOwner: true });
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, entityName);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const validate = buildEntityZodSchema(entity);
  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: result.errors }, { status: 422 });
  }
  try {
    const record = await dbRetry(() =>
      prisma.record.create({
        data: { appId, entityName: entity.name, data: jsonInput(result.clean), createdBy: r.user.id },
      })
    );
    // Run create workflows (fire-and-forget; errors are caught inside)
    void runWorkflows({ appId, appConfig: r.config, ownerId: r.user.id, triggerEntity: entity.name, triggerEvent: 'create', record: { id: record.id, ...(result.clean as object) } });
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create record', details: (e as Error).message }, { status: 500 });
  }
}
