import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { Builder } from './Builder';

export default async function BuilderPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return <Builder />;
}
