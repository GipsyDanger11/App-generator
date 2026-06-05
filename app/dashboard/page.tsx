import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Sparkles, LogOut } from 'lucide-react';

export default async function Dashboard() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const apps = await prisma.app.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: 'desc' },
  });
  return (
    <main>
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <span>App Generator</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            {user.email && <span className="text-slate-600 hidden md:inline">{user.email}</span>}
            <Link href="/builder" className="btn"><Sparkles className="h-4 w-4 mr-1" /> New app</Link>
            <a href="/api/auth/signout" className="btn-secondary"><LogOut className="h-4 w-4 mr-1" /> Sign out</a>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-1">Your apps</h1>
        <p className="text-slate-600 mb-6">Open an app to view, edit, or export it.</p>
        {apps.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-600 mb-4">No apps yet.</p>
            <Link href="/builder" className="btn">Build your first app</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {apps.map((a: { id: string; name: string; slug: string; description: string | null }) => (
              <Link key={a.id} href={`/apps/${a.id}`} className="card p-4 hover:border-brand-500 transition">
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-slate-500 mt-1">/{a.slug}</div>
                {a.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{a.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
