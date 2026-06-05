import Link from 'next/link';
import { Sparkles, ArrowRight, Wand2, Boxes, Zap, Globe, Bell, Upload, Github as GithubIcon } from 'lucide-react';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { WaveHero } from '@/components/WaveHero';

export default async function HomePage() {
  const user = await getSessionUser();
  const apps = user
    ? await prisma.app.findMany({ where: { ownerId: user.id }, take: 3, orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, slug: true } })
    : [];
  return (
    <main>
      {/* HERO with waves */}
      <WaveHero>
        <header className="relative z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white">
              <Sparkles className="h-5 w-5" />
              <span>App Generator</span>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              {user ? (
                <>
                  <Link href="/dashboard" className="px-3 py-1.5 rounded-md text-white/90 hover:text-white hover:bg-white/10">Dashboard</Link>
                  <Link href="/builder" className="inline-flex items-center gap-1 rounded-md bg-white text-purple-700 px-3 py-1.5 font-medium hover:bg-purple-50">
                    <Wand2 className="h-4 w-4" /> New app
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-3 py-1.5 rounded-md text-white/90 hover:text-white hover:bg-white/10">Sign in</Link>
                  <Link href="/signup" className="inline-flex items-center gap-1 rounded-md bg-white text-purple-700 px-3 py-1.5 font-medium hover:bg-purple-50">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <section className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-40 md:pt-24 md:pb-56 text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium border border-white/20">
            <Sparkles className="h-3.5 w-3.5" /> AI App Generator · Track A · Mistral-powered
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-white">
            Describe an app. <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">Get a working app.</span>
          </h1>
          <p className="mt-4 text-purple-100/90 max-w-2xl mx-auto text-lg">
            A metadata-driven runtime. Every form, table, page, and API is generated from a JSON config. Built to never crash on bad data.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href={user ? '/builder' : '/signup'} className="inline-flex items-center gap-1 rounded-md bg-white text-purple-700 px-5 py-2.5 font-semibold shadow-lg shadow-purple-900/30 hover:bg-purple-50">
              {user ? 'Build a new app' : 'Start for free'} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center rounded-md bg-white/10 backdrop-blur border border-white/20 text-white px-5 py-2.5 font-medium hover:bg-white/20">
              Sign in
            </Link>
          </div>
        </section>
      </WaveHero>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-4 -mt-16 md:-mt-20 relative z-20">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Boxes, t: 'Dynamic UI', d: 'Forms, tables, dashboards, and layouts rendered from config. Unknown components are skipped, never crash.' },
            { icon: Zap, t: 'Dynamic APIs', d: 'CRUD endpoints generated from your entity schema. Validation, user scoping, and error handling included.' },
            { icon: Wand2, t: 'AI by Mistral', d: 'Describe your app in plain English. We turn it into a valid config that powers the runtime.' },
          ].map((f) => (
            <div key={f.t} className="card lift p-5">
              <f.icon className="h-6 w-6 text-purple-600" />
              <div className="mt-3 font-semibold">{f.t}</div>
              <p className="text-sm text-slate-600 mt-1">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INCLUDED */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center gradient-text">Everything you need, included</h2>
        <p className="text-center text-slate-600 mt-2">All five extras are first-class features, not bolted-on.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: Upload, t: 'CSV import', d: 'Upload CSV files to any entity. Column mapping, validation, and per-row error reports.' },
            { icon: Bell, t: 'Notifications', d: 'In-app notification center, auto-triggered by workflow events.' },
            { icon: Globe, t: 'Multi-language', d: 'Locale switcher baked into every generated app. Mistral translates on the fly.' },
            { icon: GithubIcon, t: 'GitHub export', d: 'One click to push a working Next.js repo to GitHub — ready to deploy.' },
            { icon: Sparkles, t: 'PWA support', d: 'Installable, offline-capable runtime via service worker.' },
            { icon: Zap, t: 'Workflow automation', d: 'On create/update/delete: notify, set fields, call webhooks.' },
          ].map((f) => (
            <div key={f.t} className="card lift p-4 flex gap-3">
              <f.icon className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">{f.t}</div>
                <p className="text-sm text-slate-600 mt-0.5">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {user && apps.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 mb-3">Your recent apps</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {apps.map((a: { id: string; name: string; slug: string }) => (
              <Link key={a.id} href={`/apps/${a.id}`} className="card lift p-4">
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-slate-500 mt-1">/{a.slug}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="card lift overflow-hidden">
          <WaveHero className="!h-auto rounded-xl">
            <div className="px-6 py-12 md:py-16 text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white">Ready to build your first app?</h3>
              <p className="text-purple-100/90 mt-2">It takes about ten seconds.</p>
              <Link href={user ? '/builder' : '/signup'} className="mt-6 inline-flex items-center gap-1 rounded-md bg-white text-purple-700 px-5 py-2.5 font-semibold hover:bg-purple-50">
                {user ? 'Open the builder' : 'Get started'} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </WaveHero>
        </div>
      </section>
    </main>
  );
}
