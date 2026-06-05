import { NextResponse } from 'next/server';
import { findEntity, loadApp } from '@/lib/appLoader';

export async function GET(_req: Request, { params }: { params: { appId: string; entity: string } }) {
  const r = await loadApp(params.appId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const entity = findEntity(r.config, params.entity);
  if (!entity) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 });
  return NextResponse.json({ name: entity.name, label: entity.label, fields: entity.fields });
}
