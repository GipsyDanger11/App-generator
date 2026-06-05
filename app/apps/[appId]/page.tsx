import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { parseConfig } from '@/lib/config/parser';
import { AppRunner } from './AppRunner';

// Next.js 14 passes `params` as a sync object; Next.js 15+ passes a Promise.
// We accept both shapes so the page is forward-compatible and resilient to
// stale .next caches that may have been built against a different Next.js.
type Params = { appId: string };
type ParamsInput = Params | Promise<Params>;

async function unwrapParams(input: ParamsInput): Promise<Params> {
  if (input && typeof (input as Promise<Params>).then === 'function') {
    return await (input as Promise<Params>);
  }
  return input as Params;
}

export default async function AppPage({ params }: { params: ParamsInput }) {
  const { appId } = await unwrapParams(params);
  if (!appId) notFound();
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!user.id) redirect('/login');
  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) notFound();
  // Only owner can manage. View-only not implemented.
  if (app.ownerId !== user.id) redirect('/dashboard');
  const config = parseConfig(app.config);
  return (
    <AppRunner
      appId={app.id}
      name={app.name}
      slug={app.slug}
      description={app.description ?? ''}
      config={config}
      defaultLocale={app.defaultLocale}
      supportedLocales={app.supportedLocales}
    />
  );
}
