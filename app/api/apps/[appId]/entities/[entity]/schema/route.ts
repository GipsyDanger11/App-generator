import { NextResponse } from 'next/server';
import { findEntity, loadApp } from '@/lib/appLoader';
import { unwrapParams, pickString } from '@/lib/routeParams';

export async function GET(_req: Request, ctx: { params: { appId: string; entity: string } | Promise<{ appId: string; entity: string }> }) {
  const params = await unwrapParams(ctx.params);
  const appId = pickString(params, 'appId');
  const entityName = pickString(params, 'entity');
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  const r = await loadApp(appId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, entityName);
  if (!entity) return NextResponse.json({ name: entityName || 'unknown', label: entityName || 'unknown', fields: [] });
  return NextResponse.json({ name: entity.name, label: entity.label, fields: entity.fields });
}
