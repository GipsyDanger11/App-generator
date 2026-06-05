import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { parseConfig } from '@/lib/config/parser';
import { AppRunner } from './AppRunner';

export default async function AppPage({ params }: { params: { appId: string } }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const app = await prisma.app.findUnique({ where: { id: params.appId } });
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
