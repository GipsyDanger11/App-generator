import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { Builder } from './Builder';
import { TEMPLATES } from '@/lib/config/templates';

export default async function BuilderPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return <Builder templates={TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description, emoji: t.emoji }))} />;
}
