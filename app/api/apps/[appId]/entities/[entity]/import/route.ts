// CSV import endpoint. Accepts { entity, rows, mapping? } where rows is an
// array of objects keyed by CSV column names. Optionally, a mapping maps
// CSV column -> field name. Falls back to identity (case-insensitive) match.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findEntity, loadApp } from '@/lib/appLoader';
import { buildEntityZodSchema } from '@/lib/config/parser';
import { runWorkflows } from '@/lib/workflows';
import { jsonInput } from '@/lib/jsonInput';
import { unwrapParams, pickString } from '@/lib/routeParams';

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
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const rows: Array<Record<string, unknown>> = Array.isArray(body?.rows) ? body.rows : [];
  const mapping: Record<string, string> | undefined = body?.mapping && typeof body.mapping === 'object' ? body.mapping : undefined;
  if (!rows.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 });

  const validate = buildEntityZodSchema(entity);
  const fieldNames = new Set(entity.fields.map((f) => f.name.toLowerCase()));
  const result: { created: number; failed: Array<{ row: number; errors: Record<string, string> }> } = { created: 0, failed: [] };

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i] ?? {};
    const mapped: Record<string, unknown> = {};
    for (const [csvKey, value] of Object.entries(raw)) {
      const fieldName = (mapping?.[csvKey] ?? csvKey) as string;
      if (fieldNames.has(fieldName.toLowerCase())) mapped[fieldName] = value;
    }
    const v = validate(mapped);
    if (!v.ok) { result.failed.push({ row: i, errors: v.errors }); continue; }
    try {
      const rec = await prisma.record.create({ data: { appId, entityName: entity.name, data: jsonInput(v.clean), createdBy: r.user.id } });
      result.created++;
      void runWorkflows({ appId, appConfig: r.config, ownerId: r.user.id, triggerEntity: entity.name, triggerEvent: 'create', record: { id: rec.id, ...(v.clean as object) } });
    } catch (e) {
      result.failed.push({ row: i, errors: { _row: (e as Error).message } });
    }
  }
  return NextResponse.json(result);
}
