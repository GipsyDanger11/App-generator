'use client';
import { useRef, useState } from 'react';
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';

export function CsvImport({ appId, entity, onClose }: { appId: string; entity: string; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<Array<{ name: string; label?: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created?: number; failed?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadFields() {
    try {
      const r = await fetch(`/api/apps/${appId}/entities/${encodeURIComponent(entity)}/schema`);
      if (!r.ok) throw new Error('Failed to load schema');
      const j = await r.json();
      const fs: Array<{ name: string; label?: string }> = (j.fields ?? []).map((f: any) => ({ name: f.name, label: f.label }));
      setFields(fs);
      // Default mapping: case-insensitive match.
      const m: Record<string, string> = {};
      for (const h of headers) {
        const match = fs.find((f) => f.name.toLowerCase() === h.toLowerCase() || (f.label ?? '').toLowerCase() === h.toLowerCase());
        m[h] = match?.name ?? '';
      }
      setMapping(m);
    } catch (e) { setError((e as Error).message); }
  }

  async function onFile(file: File) {
    setError(null); setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: Papa.ParseResult<Record<string, string>>) => {
        const data = res.data;
        const hdrs = (res.meta.fields ?? []).filter((h): h is string => typeof h === 'string' && h.length > 0);
        setHeaders(hdrs);
        setRows(data);
        // load fields then mapping
        setTimeout(loadFields, 0);
      },
      error: (err: Error) => setError(err.message),
    });
  }

  async function submit() {
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await fetch(`/api/apps/${appId}/entities/${encodeURIComponent(entity)}/import`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows, mapping }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Import failed');
      setResult({ created: j.created, failed: (j.failed ?? []).length });
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Import CSV into <span className="text-brand-600">{entity}</span></h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          {!rows.length ? (
            <div className="border-2 border-dashed border-slate-300 rounded-md p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-slate-400" />
              <p className="text-sm text-slate-600 mt-2">Drop a CSV here or click to browse.</p>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
              <button onClick={() => inputRef.current?.click()} className="btn-secondary mt-3">Choose file</button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm text-slate-600">Found <b>{rows.length}</b> rows and <b>{headers.length}</b> columns. Map each CSV column to a field (leave blank to skip):</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {headers.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-1/2 truncate">{h}</span>
                    <span className="text-slate-400">→</span>
                    <select className="input flex-1" value={mapping[h] ?? ''} onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}>
                      <option value="">— skip —</option>
                      {fields.map((f) => <option key={f.name} value={f.name}>{f.label ?? f.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={submit} disabled={busy} className="btn">
                  {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                  Import {rows.length} rows
                </button>
                <button onClick={() => { setRows([]); setHeaders([]); }} className="btn-secondary">Reset</button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {result && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm p-3 inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Created {result.created} {result.failed ? `(failed: ${result.failed})` : ''}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
