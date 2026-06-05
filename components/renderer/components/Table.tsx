'use client';
// Table component: lists records of a bound entity, with search and pagination.
// props: { entity, pageSize, columns? }
import * as React from 'react';
import { CompProps } from '../registry';
import { LoadingState, ErrorState, EmptyState } from '../states';
import { formatDate } from '@/lib/utils';

interface EntitySchema { fields: Array<{ name: string; label?: string; type: string; showInList?: boolean }> }

export function Table({ node, appId, entityName }: CompProps) {
  const entity = (node.props?.entity as string) ?? entityName;
  const pageSize = Math.min(Math.max(Number(node.props?.pageSize ?? 20), 1), 200);
  const isPreview = appId === 'preview';
  const [state, setState] = React.useState<{ loading: boolean; error: string | null; rows: Array<Record<string, unknown>>; schema: EntitySchema | null }>(
    { loading: !isPreview, error: null, rows: [], schema: null },
  );

  // In the builder preview there is no real saved app — skip the fetch and
  // show a placeholder so the user can see the table structure.
  if (isPreview) {
    return (
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50/40 p-6 text-center">
        <div className="text-sm font-medium text-purple-700 mb-1">Table · <code className="text-xs bg-purple-100 px-1 rounded">{entity}</code></div>
        <p className="text-xs text-slate-500">Save the app to see live data here.</p>
      </div>
    );
  }
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(0);

  React.useEffect(() => {
    if (!entity) { setState({ loading: false, error: 'No entity bound to this table', rows: [], schema: null }); return; }
    let cancelled = false;
    (async () => {
      try {
        const [rowsRes, schemaRes] = await Promise.all([
          fetch(`/api/apps/${appId}/entities/${encodeURIComponent(entity)}`),
          fetch(`/api/apps/${appId}/entities/${encodeURIComponent(entity)}/schema`),
        ]);
        if (!rowsRes.ok) throw new Error(`HTTP ${rowsRes.status}`);
        const data = await rowsRes.json();
        const rows = Array.isArray(data) ? data : (data.records ?? []);
        const schema = schemaRes.ok ? await schemaRes.json() : null;
        if (!cancelled) setState({ loading: false, error: null, rows, schema });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: (e as Error).message, rows: [], schema: null });
      }
    })();
    return () => { cancelled = true; };
  }, [appId, entity]);

  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState message={state.error} />;

  const allFields = state.schema?.fields ?? [];
  const cols = (Array.isArray(node.props?.columns) ? (node.props?.columns as string[]) : null)
    ?.map((n) => allFields.find((f) => f.name === n)).filter(Boolean) as typeof allFields;
  const visibleFields = cols && cols.length ? cols : allFields.filter((f) => f.showInList !== false);
  const filtered = q
    ? state.rows.filter((r) => visibleFields.some((f) => String(r[f.name] ?? '').toLowerCase().includes(q.toLowerCase())))
    : state.rows;
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  if (!state.rows.length) return <EmptyState title="No records yet" hint="Use the form on the page to add the first one." />;

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 p-3 border-b border-slate-200">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="Search…"
          className="w-full md:w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="ml-auto text-xs text-slate-500">{filtered.length} record{filtered.length === 1 ? '' : 's'}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {visibleFields.map((f) => (
                <th key={f.name} className="text-left font-medium px-3 py-2">{f.label ?? f.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={(r.id as string) ?? Math.random()} className="border-t border-slate-100 hover:bg-slate-50">
                {visibleFields.map((f) => (
                  <td key={f.name} className="px-3 py-2 align-top text-slate-700">
                    {formatCell(r[f.name], f.type)}
                  </td>
                ))}
              </tr>
            ))}
            {!paged.length && (
              <tr><td colSpan={visibleFields.length} className="px-3 py-6 text-center text-slate-500">No matches.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2 p-3 border-t border-slate-200 text-sm">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-50">Prev</button>
          <span className="text-slate-600">Page {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}

function formatCell(value: unknown, type: string): React.ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-slate-400">—</span>;
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (type === 'date' || type === 'datetime') return formatDate(value as string);
  if (type === 'json') return <code className="text-xs bg-slate-100 rounded px-1 py-0.5">{JSON.stringify(value).slice(0, 80)}</code>;
  if (type === 'multiselect' && Array.isArray(value)) return value.join(', ');
  const s = String(value);
  return s.length > 200 ? s.slice(0, 200) + '…' : s;
}
