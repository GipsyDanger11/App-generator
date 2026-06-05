'use client';
import { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';

export function GithubExport({ appId, defaultName }: { appId: string; defaultName: string }) {
  const [repoName, setRepoName] = useState(defaultName);
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url?: string; error?: string } | null>(null);

  async function exportNow() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch(`/api/apps/${appId}/export-github`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ repoName, private: isPrivate }) });
      const j = await res.json();
      if (!res.ok) setResult({ error: j.error || 'Failed' });
      else setResult({ url: j.url });
    } catch (e) { setResult({ error: (e as Error).message }); } finally { setBusy(false); }
  }

  return (
    <div className="max-w-2xl mx-auto card p-6">
      <div className="flex items-center gap-2 mb-2"><Github className="h-5 w-5" /><h2 className="font-semibold">Export to GitHub</h2></div>
      <p className="text-sm text-slate-600">Generates a new GitHub repo containing the source code of this app (renderer + config) and pushes it for you.</p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-sm text-slate-600">Repository name</label>
          <input className="input mt-1" value={repoName} onChange={(e) => setRepoName(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /> Make repository private
        </label>
        <button onClick={exportNow} disabled={busy} className="btn">
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Github className="h-4 w-4 mr-1" />}
          {busy ? 'Pushing…' : 'Create & push repo'}
        </button>
        {result?.url && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm p-3">
            Repository created. <a className="underline" href={result.url} target="_blank" rel="noreferrer">Open on GitHub →</a>
          </div>
        )}
        {result?.error && <p className="text-sm text-red-600 mt-2">{result.error}</p>}
      </div>
    </div>
  );
}
