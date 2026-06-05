'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { Renderer } from '@/components/renderer/Renderer';
import { setI18nContext } from '@/components/renderer/useT';
import { parseConfig } from '@/lib/config/parser';
import type { AppConfig } from '@/lib/config/types';

const SUGGESTIONS = [
  'A CRM for tracking customers and deals with a dashboard of total revenue.',
  'A habit tracker app with daily entries and a streak counter.',
  'An inventory app with products, stock levels, and low-stock alerts.',
  'A project management app with tasks, assignees, and status boards.',
];

export function Builder() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(p?: string) {
    const text = (p ?? prompt).trim();
    if (!text) return;
    setError(null); setLoading(true); setConfig(null);
    try {
      const res = await fetch('/api/apps/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: text }) });
      if (!res.ok) throw new Error('Generation failed');
      const j = await res.json();
      const safe = parseConfig(j.config);
      setConfig(safe);
      setName(safe.name);
      setI18nContext({ i18n: safe.i18n, locale: 'en' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!config) return;
    setError(null); setSaving(true);
    try {
      const res = await fetch('/api/apps', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: name || config.name, description: config.description, config }) });
      if (!res.ok) throw new Error('Save failed');
      const j = await res.json();
      router.push(`/apps/${j.id}`);
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <a href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">← Back</a>
          <div className="flex items-center gap-2">
            {config && (
              <button onClick={save} disabled={saving} className="btn">{saving ? 'Saving…' : 'Save app'}</button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">Build with AI</h1>
        <p className="text-slate-600 mt-1">Describe your app. We&apos;ll generate a full config and let you preview it live.</p>

        <div className="mt-6 card p-4">
          <label className="text-sm font-medium">App description</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A CRM for tracking customers and deals with a dashboard of total revenue."
            className="input mt-2"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => { setPrompt(s); generate(s); }} className="text-xs px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50">
                {s}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => generate()} disabled={loading || !prompt.trim()} className="btn">
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              {loading ? 'Generating…' : 'Generate'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>

        {config && (
          <>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="card p-4 md:col-span-1">
                <h2 className="font-semibold mb-2">App details</h2>
                <label className="text-sm text-slate-600">Name</label>
                <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
                <label className="text-sm text-slate-600 mt-3 block">Description</label>
                <textarea rows={2} className="input mt-1" value={config.description ?? ''} onChange={(e) => setConfig({ ...config, description: e.target.value })} />
                <h3 className="text-sm font-medium mt-4 mb-1">Entities</h3>
                <ul className="text-sm text-slate-700 space-y-1">
                  {config.entities.map((e) => (<li key={e.name}>• <b>{e.name}</b> ({e.fields.length} fields)</li>))}
                </ul>
                <h3 className="text-sm font-medium mt-4 mb-1">Pages</h3>
                <ul className="text-sm text-slate-700 space-y-1">
                  {config.pages.map((p) => (<li key={p.id}>• <code>{p.route}</code> — {p.title}</li>))}
                </ul>
              </div>
              <div className="card p-4 md:col-span-2">
                <h2 className="font-semibold mb-2">Live preview</h2>
                <p className="text-xs text-slate-500 mb-3">Rendered by the same engine that runs in production. No data is saved yet.</p>
                <div className="border border-slate-200 rounded-md p-4 bg-slate-50 min-h-[300px]">
                  <Renderer node={config.pages[0]?.root ?? null} appId="preview" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
