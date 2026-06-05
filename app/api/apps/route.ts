import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { parseConfig } from '@/lib/config/parser';
import { slugify } from '@/lib/utils';
import { jsonInput } from '@/lib/jsonInput';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  config: z.unknown(), // we use the safe parser; do not enforce shape
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const apps = await prisma.app.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, slug: true, description: true, updatedAt: true, createdAt: true, defaultLocale: true, supportedLocales: true },
  });
  return NextResponse.json(apps);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  const safe = parseConfig(parsed.data.config);
  const baseSlug = slugify(parsed.data.name) || 'app';
  let slug = baseSlug;
  let i = 1;
  while (await prisma.app.findUnique({ where: { slug } })) { slug = `${baseSlug}-${i++}`; }
  const app = await prisma.app.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? safe.description,
      slug,
      ownerId: user.id,
      config: jsonInput(safe),
    },
  });
  return NextResponse.json({ id: app.id, slug: app.slug });
}
