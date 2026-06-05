'use client';
import { useState } from 'react';
import { Renderer } from '@/components/renderer/Renderer';
import { setI18nContext } from '@/components/renderer/useT';
import { parseConfig } from '@/lib/config/parser';
import type { AppConfig } from '@/lib/config/types';
import { Save, Loader2 } from 'lucide-react';

export function ConfigView({ appId, initialConfig }: { appId: string; initialConfig: AppConfig }) {
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [json, setJson] = useState<string>(JSON.stringify(initialConfig, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function syncFromJson() {
    try {
      const parsed = parseConfig(JSON.parse(json));
      setConfig(parsed);
      setI18nContext({ i18n: parsed.i18n, locale: 'en' });
      setError(null);
    } catch (e) { setError('Invalid JSON: ' + (e as Error).message); }
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/apps/${appId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ config }) });
      if (!res.ok) throw new Error('Save failed');
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Config JSON</h2>
          <div className="flex items-center gap-2">
            <button onClick={syncFromJson} className="btn-secondary text-xs">Re-parse</button>
            <button onClick={save} disabled={saving} className="btn text-xs">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}Save</button>
          </div>
        </div>
        <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={28} className="input font-mono text-xs" />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        {savedAt && <p className="text-xs text-slate-500 mt-2">Saved at {savedAt}</p>}
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Live preview</h2>
        <p className="text-xs text-slate-500 mb-2">After re-parsing, the preview updates.</p>
        <div className="border border-slate-200 rounded-md p-3 bg-slate-50 min-h-[400px]">
          <Renderer node={config.pages[0]?.root ?? null} appId={appId} />
        </div>
        <details className="mt-3 text-xs text-slate-600">
          <summary className="cursor-pointer">Entities ({config.entities.length})</summary>
          <pre className="bg-slate-50 p-2 rounded mt-1 overflow-auto">{JSON.stringify(config.entities, null, 2)}</pre>
        </details>
        <details className="mt-2 text-xs text-slate-600">
          <summary className="cursor-pointer">Pages ({config.pages.length})</summary>
          <pre className="bg-slate-50 p-2 rounded mt-1 overflow-auto">{JSON.stringify(config.pages.map((p) => ({ id: p.id, route: p.route, title: p.title })), null, 2)}</pre>
        </details>
      </div>
    </div>
  );
}
