'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Loader2, Wand2, ArrowRight, Home, Table,
  FileEdit, BarChart3, Layout, Save, Eye, Layers,
} from 'lucide-react';
import { Renderer } from '@/components/renderer/Renderer';
import { setI18nContext } from '@/components/renderer/useT';
import { parseConfig } from '@/lib/config/parser';
import type { AppConfig } from '@/lib/config/types';
import { WaveHero } from '@/components/WaveHero';

interface Tpl { id: string; name: string; description: string; emoji: string }

const SUGGESTIONS = [
  'A habit tracker app with daily habits, streaks, and progress charts.',
  'A CRM for tracking customers and deals with a dashboard of total revenue.',
  'An inventory app with products, stock levels, and low-stock alerts.',
  'A project management app with tasks, assignees, and status boards.',
];

// Icon for route-type inference
function routeIcon(route: string, root?: { kind: string }): React.ElementType {
  if (route === '/') return Home;
  const kind = root?.kind;
  if (kind === 'table') return Table;
  if (kind === 'form') return FileEdit;
  if (kind === 'chart') return BarChart3;
  if (kind === 'stats') return BarChart3;
  return Layout;
}

// Emoji badge for route type
function routeEmoji(route: string, root?: { kind: string }): string {
  if (route === '/') return '🏠';
  const kind = root?.kind;
  if (kind === 'table') return '📋';
  if (kind === 'form') return '✏️';
  if (kind === 'chart') return '📊';
  if (kind === 'stats') return '📊';
  return '📄';
}

export function Builder({ templates }: { templates: Tpl[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRoute, setPreviewRoute] = useState('/');

  async function call(payload: { prompt?: string; templateId?: string }) {
    setError(null); setLoading(true); setConfig(null);
    try {
      const res = await fetch('/api/apps/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Generation failed');
      }
      const j = await res.json();
      const safe = parseConfig(j.config);
      setConfig(safe);
      setName(safe.name);
      setPreviewRoute('/');
      setI18nContext({ i18n: safe.i18n, locale: 'en' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function generate(p?: string) {
    const text = (p ?? prompt).trim();
    if (!text) return;
    await call({ prompt: text });
  }

  async function useTemplate(tpl: Tpl) {
    await call({ templateId: tpl.id });
  }

  async function save() {
    if (!config) return;
    setError(null); setSaving(true);
    try {
      const res = await fetch('/api/apps', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: name || config.name, description: config.description, config }) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Save failed');
      }
      const j = await res.json();
      router.push(`/apps/${j.id}`);
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }

  // Compute unique routes for the preview tabs (one tab per route)
  const uniquePreviewRoutes = config
    ? Array.from(new Map(config.pages.map((p) => [p.route, p])).values())
    : [];

  return (
    <main>
      <WaveHero>
        <header className="relative z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
            <Link href="/dashboard" className="text-sm text-white/90 hover:text-white inline-flex items-center gap-1">← Dashboard</Link>
            {config && (
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-white text-purple-700 px-5 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="h-4 w-4" /> Save & Open App</>
                )}
              </button>
            )}
          </div>
        </header>
        <section className="relative z-10 max-w-6xl mx-auto px-4 pt-6 pb-24 text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium border border-white/20">
            <Wand2 className="h-3.5 w-3.5" /> Builder · powered by AI
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">Build with AI</h1>
          <p className="text-purple-100/90 mt-1">Describe your app, or start from a template.</p>
        </section>
      </WaveHero>

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20 pb-12">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 card p-5">
            <h2 className="font-semibold mb-2">Describe your app</h2>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A habit tracker app with daily habits, streaks, and progress charts."
              className="input"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => { setPrompt(s); generate(s); }} className="text-xs px-3 py-1.5 rounded-full border border-purple-200 hover:bg-purple-50 text-purple-900">
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => generate()} disabled={loading || !prompt.trim()} className="btn">
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                {loading ? 'Generating…' : 'Generate'}
              </button>
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold mb-2">Or use a template</h2>
            <p className="text-xs text-slate-500 mb-3">Pre-built configs that always work.</p>
            <div className="space-y-2">
              {templates.map((t) => (
                <button key={t.id} onClick={() => useTemplate(t)} disabled={loading} className="w-full text-left flex items-center gap-3 rounded-md border border-purple-100 hover:border-purple-300 hover:bg-purple-50 p-3 transition">
                  <div className="text-2xl">{t.emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.description}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-purple-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {config && (
          <div className="mt-6 space-y-4">
            {/* App Overview Panel */}
            <div className="card p-5 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-100 p-3">
                    <Layers className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{name || config.name}</h2>
                    <p className="text-sm text-slate-500">{config.description}</p>
                  </div>
                </div>
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn text-base px-6 py-3 shadow-lg hover:shadow-xl"
                >
                  {saving ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="h-5 w-5 mr-2" /> Save & Open Full App</>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white border border-purple-100 p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{config.entities.length}</div>
                  <div className="text-xs text-slate-500 font-medium">Entities</div>
                </div>
                <div className="rounded-lg bg-white border border-purple-100 p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{config.entities.reduce((s, e) => s + e.fields.length, 0)}</div>
                  <div className="text-xs text-slate-500 font-medium">Total Fields</div>
                </div>
                <div className="rounded-lg bg-white border border-purple-100 p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{uniquePreviewRoutes.length}</div>
                  <div className="text-xs text-slate-500 font-medium">Routes</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="card p-4 md:col-span-1">
                <h2 className="font-semibold mb-3">App details</h2>
                <label className="text-sm text-slate-600">Name</label>
                <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
                <label className="text-sm text-slate-600 mt-3 block">Description</label>
                <textarea rows={2} className="input mt-1" value={config.description ?? ''} onChange={(e) => setConfig({ ...config, description: e.target.value })} />
                <h3 className="text-sm font-medium mt-4 mb-2">Entities ({config.entities.length})</h3>
                <ul className="text-sm text-slate-700 space-y-1.5">
                  {config.entities.map((e) => (
                    <li key={e.name} className="flex items-center gap-2 bg-slate-50 rounded-md px-2.5 py-1.5 border border-slate-100">
                      <span className="text-purple-600 font-medium">{e.label ?? e.name}</span>
                      <span className="ml-auto text-xs text-slate-400">{e.fields.length} fields</span>
                    </li>
                  ))}
                </ul>
                <h3 className="text-sm font-medium mt-4 mb-2">Routes ({uniquePreviewRoutes.length})</h3>
                <ul className="text-sm text-slate-700 space-y-1.5">
                  {uniquePreviewRoutes.map((p) => (
                    <li key={p.route} className="flex items-center gap-2 bg-slate-50 rounded-md px-2.5 py-1.5 border border-slate-100">
                      <span>{routeEmoji(p.route, p.root)}</span>
                      <code className="text-xs font-mono text-purple-600">{p.route}</code>
                      <span className="ml-auto text-xs text-slate-400">{p.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-4 md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-500" />
                    Live Preview
                  </h2>
                  <span className="text-xs text-slate-400">{uniquePreviewRoutes.length} route{uniquePreviewRoutes.length !== 1 ? 's' : ''}</span>
                </div>
                {/* Route tabs — prominent with icons */}
                {uniquePreviewRoutes.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {uniquePreviewRoutes.map((p) => {
                      const Icon = routeIcon(p.route, p.root);
                      const isActive = previewRoute === p.route;
                      return (
                        <button
                          key={p.route}
                          onClick={() => setPreviewRoute(p.route)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{routeEmoji(p.route, p.root)}</span>
                          <span className="font-mono text-xs">{p.route}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="border border-purple-100 rounded-lg p-4 bg-gradient-to-br from-purple-50/40 to-white min-h-[300px] space-y-4">
                  {config.pages
                    .filter((p) => p.route === previewRoute)
                    .map((p) => (
                      <Renderer
                        key={p.id}
                        node={p.root}
                        appId="preview"
                        entityName={p.entity}
                        config={config}
                      />
                    ))
                  }
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Previewing route: <span className="font-medium text-slate-600">{previewRoute}</span>
                  <span className="ml-2 text-purple-400">· Tables and forms show mock data — save to see real data</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
