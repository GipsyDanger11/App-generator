// Session helper for server components and route handlers.
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
  if (!user?.id) return null;
  return { id: user.id, email: user.email ?? null, name: user.name ?? null };
}
