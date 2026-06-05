import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const user = await getSessionUser();
  const apps = user
    ? await prisma.app.findMany({ where: { ownerId: user.id }, take: 3, orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, slug: true } })
    : [];
  return (
    <main>
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <span>App Generator</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {user ? (
              <>
                <Link href="/dashboard" className="px-3 py-1.5 rounded-md hover:bg-slate-100">Dashboard</Link>
                <Link href="/builder" className="btn"><Sparkles className="h-4 w-4 mr-1" /> New app</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 rounded-md hover:bg-slate-100">Sign in</Link>
                <Link href="/signup" className="btn">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" /> AI App Generator · Track A
        </span>
        <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
          Describe an app. <span className="text-brand-600">Get a working app.</span>
        </h1>
        <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-lg">
          A metadata-driven runtime. Every form, table, page, and API is generated from a JSON config. Built to never crash on bad data.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={user ? '/builder' : '/signup'} className="btn">
            {user ? 'Build a new app' : 'Start for free'} <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
          <Link href="/login" className="btn-secondary">Sign in</Link>
        </div>
      </section>

      {user && apps.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 mb-3">Your recent apps</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {apps.map((a) => (
              <Link key={a.id} href={`/apps/${a.id}`} className="card p-4 hover:border-brand-500 transition">
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-slate-500 mt-1">/{a.slug}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 pb-24 grid md:grid-cols-3 gap-4">
        {[
          { t: 'Dynamic UI', d: 'Forms, tables, dashboards, and layouts rendered from config. Unknown components are skipped, never crash.' },
          { t: 'Dynamic APIs', d: 'CRUD endpoints generated from your entity schema. Validation, user scoping, and error handling included.' },
          { t: 'AI by Mistral', d: 'Describe your app in plain English. We turn it into a valid config that powers the runtime.' },
        ].map((f) => (
          <div key={f.t} className="card p-5">
            <div className="font-semibold">{f.t}</div>
            <p className="text-sm text-slate-600 mt-1">{f.d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
