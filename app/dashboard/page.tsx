import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Sparkles, LogOut, Wand2, ArrowRight } from 'lucide-react';
import { WaveHero } from '@/components/WaveHero';

export default async function Dashboard() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!user.id) redirect('/login');
  const apps = await prisma.app.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: 'desc' },
  });
  return (
    <main>
      <WaveHero>
        <header className="relative z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white">
              <Sparkles className="h-5 w-5" />
              <span>App Generator</span>
            </Link>
            <div className="flex items-center gap-2 text-sm">
              {user.email && <span className="text-purple-100/80 hidden md:inline">{user.email}</span>}
              <Link href="/builder" className="inline-flex items-center gap-1 rounded-md bg-white text-purple-700 px-3 py-1.5 font-medium hover:bg-purple-50">
                <Wand2 className="h-4 w-4" /> New app
              </Link>
              <a href="/api/auth/signout" className="inline-flex items-center gap-1 rounded-md bg-white/10 backdrop-blur border border-white/20 text-white px-3 py-1.5 font-medium hover:bg-white/20">
                <LogOut className="h-4 w-4" /> Sign out
              </a>
            </div>
          </div>
        </header>
        <section className="relative z-10 max-w-6xl mx-auto px-4 pt-10 pb-28">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Your apps</h1>
          <p className="text-purple-100/80 mt-1">Open one to view, edit, or deploy.</p>
        </section>
      </WaveHero>

      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20 pb-16">
        {apps.length === 0 ? (
          <div className="card lift p-8 text-center">
            <p className="text-slate-600 mb-4">No apps yet — let&apos;s build your first one.</p>
            <Link href="/builder" className="btn inline-flex">Open the builder <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {apps.map((a: { id: string; name: string; slug: string; description: string | null; updatedAt: Date }) => (
              <Link key={a.id} href={`/apps/${a.id}`} className="card lift p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-slate-900">{a.name}</div>
                  <ArrowRight className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-xs text-slate-500 mt-1">/{a.slug}</div>
                {a.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{a.description}</p>}
                <div className="text-xs text-slate-400 mt-3">Updated {new Date(a.updatedAt).toLocaleDateString()}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
