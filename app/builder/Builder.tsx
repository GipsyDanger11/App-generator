'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Wand2, ArrowRight } from 'lucide-react';
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

export function Builder({ templates }: { templates: Tpl[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPageIdx, setPreviewPageIdx] = useState(0);

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
      setPreviewPageIdx(0);
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

  return (
    <main>
      <WaveHero>
        <header className="relative z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
            <Link href="/dashboard" className="text-sm text-white/90 hover:text-white inline-flex items-center gap-1">← Dashboard</Link>
            {config && (
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-white text-purple-700 px-4 py-2 text-sm font-semibold hover:bg-purple-50">
                {saving ? 'Saving…' : 'Save & open'} <ArrowRight className="h-4 w-4" />
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
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="card p-4 md:col-span-1">
              <h2 className="font-semibold mb-2">App details</h2>
              <label className="text-sm text-slate-600">Name</label>
              <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              <label className="text-sm text-slate-600 mt-3 block">Description</label>
              <textarea rows={2} className="input mt-1" value={config.description ?? ''} onChange={(e) => setConfig({ ...config, description: e.target.value })} />
              <h3 className="text-sm font-medium mt-4 mb-1">Entities ({config.entities.length})</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                {config.entities.map((e) => (<li key={e.name}>• <b>{e.name}</b> ({e.fields.length} fields)</li>))}
              </ul>
              <h3 className="text-sm font-medium mt-4 mb-1">Pages ({config.pages.length})</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                {config.pages.map((p) => (<li key={p.id}>• <code className="text-xs bg-purple-50 px-1 rounded">{p.route}</code> — {p.title}</li>))}
              </ul>
            </div>
            <div className="card p-4 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Live preview</h2>
                <span className="text-xs text-slate-400">{config.pages.length} page{config.pages.length !== 1 ? 's' : ''} generated</span>
              </div>
              {/* Page tabs — one per page, identified by route */}
              {config.pages.length > 1 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {config.pages.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setPreviewPageIdx(idx)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                        previewPageIdx === idx
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      {p.route}
                    </button>
                  ))}
                </div>
              )}
              <div className="border border-purple-100 rounded-md p-4 bg-gradient-to-br from-purple-50 to-white min-h-[300px]">
                <Renderer
                  node={config.pages[previewPageIdx]?.root ?? null}
                  appId="preview"
                  entityName={config.pages[previewPageIdx]?.entity}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Previewing: <span className="font-medium text-slate-600">{config.pages[previewPageIdx]?.title ?? config.pages[previewPageIdx]?.route}</span>
                {config.pages[previewPageIdx]?.entity && (
                  <span className="ml-1 text-purple-500">· entity: {config.pages[previewPageIdx]?.entity}</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
