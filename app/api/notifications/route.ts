import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get('unread') === '1';
  const items = await prisma.notification.findMany({
    where: { userId: user.id, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json(items);
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (body?.markAllRead) {
    await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  if (Array.isArray(body?.ids)) {
    await prisma.notification.updateMany({ where: { userId: user.id, id: { in: body.ids.map(String) } }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'No operation' }, { status: 400 });
}
