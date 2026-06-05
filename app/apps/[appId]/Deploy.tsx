'use client';
// Deployment helper. Two paths:
// 1. Show a checklist of what to do for a production deploy
// 2. One-click Vercel deploy (requires GitHub repo first)
import { useState } from 'react';
import { Rocket, CheckCircle2, ExternalLink, Copy, Server, Database, KeyRound, Globe2, Github as GithubIcon } from 'lucide-react';

interface Checklist { id: string; label: string; description: string; done: boolean }

interface Props { appId: string; appName: string }

export function Deploy({ appName }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  // Simple heuristic checklist based on environment
  const items: Checklist[] = [
    { id: 'db', label: 'Provision a Postgres database', description: 'Use Neon (free) or any Postgres provider. Copy the connection string.', done: false, },
    { id: 'env', label: 'Set environment variables', description: 'DATABASE_URL, NEXTAUTH_SECRET, MISTRAL_API_KEY, and any OAuth keys.', done: false, },
    { id: 'schema', label: 'Push the Prisma schema', description: 'Run `npx prisma db push` against your production database.', done: false, },
    { id: 'repo', label: 'Export to GitHub', description: 'Click the GitHub tab and push the repo to your account.', done: false, },
    { id: 'vercel', label: 'Deploy to Vercel', description: 'Import the GitHub repo, set the env vars, and click Deploy.', done: false, },
  ];

  const vercelEnv = [
    'DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'MISTRAL_API_KEY',
    'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_EXPORT_TOKEN',
  ];

  const snippets = {
    install: 'npm install',
    prisma: 'npx prisma db push',
    dev: 'npm run dev',
    build: 'npm run build',
    start: 'npm start',
  };

  function copy(text: string, id: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 p-2.5">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Deploy <span className="gradient-text">{appName}</span></h2>
            <p className="text-sm text-slate-600">From local dev to production in five steps.</p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-purple-600" /> Deployment checklist</h3>
        <ol className="space-y-3">
          {items.map((it, i) => (
            <li key={it.id} className="flex gap-3">
              <div className="shrink-0 h-6 w-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">{i + 1}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{it.label}</div>
                <div className="text-xs text-slate-500">{it.description}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Local commands */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Server className="h-4 w-4 text-purple-600" /> Local commands</h3>
        <div className="space-y-2">
          {Object.entries(snippets).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 font-mono text-xs">
              <span className="text-slate-500 w-16">$</span>
              <span className="flex-1 text-slate-800">{v}</span>
              <button onClick={() => copy(v, k)} className="text-purple-600 hover:text-purple-800 inline-flex items-center gap-1 text-xs">
                {copied === k ? <><CheckCircle2 className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Env vars */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><KeyRound className="h-4 w-4 text-purple-600" /> Environment variables</h3>
        <p className="text-xs text-slate-500 mb-3">Set these in your Vercel project settings, your CI, or your server&apos;s env.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {vercelEnv.map((k) => (
            <div key={k} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 font-mono text-xs">
              <code className="text-slate-800 flex-1">{k}</code>
              <button onClick={() => copy(k, k)} className="text-purple-600 hover:text-purple-800">
                {copied === k ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* One-click deploys */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Globe2 className="h-4 w-4 text-purple-600" /> One-click deploys</h3>
        <p className="text-sm text-slate-600 mb-3">After you&apos;ve exported to GitHub, you can deploy to your favorite host.</p>
        <div className="flex flex-wrap gap-2">
          <a href="https://vercel.com/new/clone" target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-1"><Rocket className="h-4 w-4" /> Deploy to Vercel <ExternalLink className="h-3 w-3" /></a>
          <a href="https://render.com/deploy" target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-1"><Server className="h-4 w-4" /> Deploy to Render <ExternalLink className="h-3 w-3" /></a>
          <a href="https://railway.app/new" target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-1"><Database className="h-4 w-4" /> Deploy to Railway <ExternalLink className="h-3 w-3" /></a>
          <a href="https://deploy.workers.cloudflare.com/?url=" target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-1"><Globe2 className="h-4 w-4" /> Deploy to Cloudflare <ExternalLink className="h-3 w-3" /></a>
        </div>
      </div>

      {/* Pro tip */}
      <div className="card p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-200">
        <p className="text-sm text-purple-900">
          <b>Pro tip:</b> for the cleanest deploy, set the <code className="bg-white/60 px-1 rounded">DATABASE_URL</code> in Vercel first, push the GitHub repo, then let Vercel auto-detect Next.js and run <code className="bg-white/60 px-1 rounded">prisma generate &amp;&amp; next build</code>.
        </p>
      </div>
    </div>
  );
}
