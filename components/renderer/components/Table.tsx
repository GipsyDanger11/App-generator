'use client';
// Table component: lists records of a bound entity, with search and pagination.
// props: { entity, pageSize, columns? }
import * as React from 'react';
import { CompProps } from '../registry';
import { LoadingState, ErrorState, EmptyState } from '../states';
import { formatDate } from '@/lib/utils';
import { useAppConfig } from '../AppConfigContext';

interface EntitySchema { fields: Array<{ name: string; label?: string; type: string; showInList?: boolean }> }

export function Table({ node, appId, entityName }: CompProps) {
  const entity = (node.props?.entity as string) ?? entityName;
  const pageSize = Math.min(Math.max(Number(node.props?.pageSize ?? 20), 1), 200);
  const isPreview = appId === 'preview';
  const appConfig = useAppConfig();
  
  const [state, setState] = React.useState<{ loading: boolean; error: string | null; rows: Array<Record<string, unknown>>; schema: EntitySchema | null }>(
    { loading: !isPreview, error: null, rows: [], schema: null },
  );

  // In preview mode, show realistic mock data based on entity schema
  if (isPreview && appConfig) {
    const entityDef = appConfig.entities.find((e) => e.name === entity);
    if (entityDef) {
      return <TablePreview entity={entityDef} pageSize={pageSize} columns={node.props?.columns as string[] | undefined} />;
    }
    
    return (
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50/40 p-6 text-center">
        <div className="text-sm font-medium text-purple-700 mb-1">Table · <code className="text-xs bg-purple-100 px-1 rounded">{entity}</code></div>
        <p className="text-xs text-slate-500">Entity not found in config.</p>
      </div>
    );
  }

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

  if (!state.rows.length) return <EmptyState title="No records yet" hint="Use the form to add the first one." />;

  const entityLabel = state.schema?.fields?.[0] ? (state.rows[0] as any).name || entity : entity;
  const formRoute = `/${entity.toLowerCase()}s/new`; // Guess the form route

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header with New button */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Search…"
            className="w-full md:w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="text-xs text-slate-500">{filtered.length} record{filtered.length === 1 ? '' : 's'}</div>
        </div>
        <a 
          href={formRoute}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New {entity}
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 sticky top-0">
            <tr>
              {visibleFields.map((f) => (
                <th key={f.name} className="text-left font-medium px-4 py-3">{f.label ?? f.name}</th>
              ))}
              <th className="text-right font-medium px-4 py-3 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r, idx) => (
              <tr key={(r.id as string) ?? idx} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                {visibleFields.map((f) => (
                  <td key={f.name} className="px-4 py-3 align-top text-slate-700">
                    {formatCell(r[f.name], f.type)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => alert(`Edit record ${r.id || idx + 1}`)}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => { if (confirm('Delete this record?')) alert(`Delete ${r.id || idx + 1}`); }}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!paged.length && (
              <tr><td colSpan={visibleFields.length + 1} className="px-4 py-8 text-center text-slate-500">No matches.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2 p-3 border-t border-slate-200 text-sm">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors">Prev</button>
          <span className="text-slate-600">Page {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}

// Preview component for builder - shows realistic mock data
function TablePreview({ entity, pageSize, columns }: { entity: any; pageSize: number; columns?: string[] }) {
  const visibleFields = columns 
    ? columns.map(c => entity.fields.find((f: any) => f.name === c)).filter(Boolean)
    : entity.fields.filter((f: any) => f.showInList !== false).slice(0, 6);

  // Generate 5 mock rows for a richer preview
  const mockRows = [1, 2, 3, 4, 5].map(i => {
    const row: Record<string, any> = { id: i };
    entity.fields.forEach((f: any) => {
      row[f.name] = generateMockValue(f.type, f.name, i, f.options);
    });
    return row;
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-200 bg-purple-50/30">
        <div className="flex items-center gap-2">
          <input
            disabled
            placeholder="Search…"
            className="w-full md:w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white/50"
          />
          <div className="text-xs text-slate-500">3 records (preview)</div>
        </div>
        <button 
          disabled
          className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-md opacity-75 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New {entity.label}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {visibleFields.map((f: any) => (
                <th key={f.name} className="text-left font-medium px-4 py-3">{f.label ?? f.name}</th>
              ))}
              <th className="text-right font-medium px-4 py-3 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockRows.map((r, idx) => (
              <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                {visibleFields.map((f: any) => (
                  <td key={f.name} className="px-4 py-3 text-slate-700">
                    {formatCell(r[f.name], f.type)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="px-2 py-1 text-xs text-slate-400">Edit</span>
                    <span className="px-2 py-1 text-xs text-slate-400">Delete</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-slate-200 bg-purple-50/20 text-xs text-center text-purple-700">
        📋 Preview Mode - Save the app to see real data and working actions
      </div>
    </div>
  );
}

// Generate realistic mock values based on field type and name
function generateMockValue(type: string, fieldName: string, seed: number, options?: {value: string; label: string}[]): any {
  const name = fieldName.toLowerCase();

  // Select — always use actual defined options
  if (type === 'select' && options && options.length > 0) {
    return options[seed % options.length].label;
  }
  if (type === 'multiselect' && options && options.length > 0) {
    return [options[seed % options.length].label, options[(seed + 1) % options.length].label].join(', ');
  }

  if (type === 'boolean') return seed % 3 !== 0;

  if (type === 'number') {
    if (name.includes('price') || name.includes('amount') || name.includes('cost') || name.includes('revenue'))
      return `$${(seed * 129 + 49).toLocaleString()}`;
    if (name.includes('stock') || name.includes('quantity') || name.includes('qty'))
      return seed * 23 + 5;
    if (name.includes('rating') || name.includes('score'))
      return (3.5 + (seed % 15) / 10).toFixed(1);
    if (name.includes('age')) return 22 + seed * 7;
    if (name.includes('percent') || name.includes('rate')) return `${(seed * 11 + 40) % 100}%`;
    if (name.includes('streak') || name.includes('count')) return seed * 4 + 1;
    return seed * 100 + 50;
  }

  if (type === 'date') {
    const d = new Date(2024, seed % 12, (seed * 7 % 28) + 1);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (type === 'datetime') {
    const d = new Date(2024, seed % 12, (seed * 7 % 28) + 1, 9 + seed % 8, [0, 15, 30, 45][seed % 4]);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // String types — rich name/label pools
  const PEOPLE   = ['Alice Johnson', 'Bob Martinez', 'Carol Lee', 'David Kim', 'Emma Wilson', 'Frank Davis'];
  const COMPANIES= ['Acme Corp', 'BlueSky Ltd', 'Delta Systems', 'Echo Media', 'Forge Analytics', 'Globe Tech'];
  const CITIES   = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Seattle'];
  const STATUSES = ['Active', 'Pending', 'Completed', 'In Progress', 'Archived', 'Draft'];
  const TAGS     = ['Design', 'Engineering', 'Marketing', 'Sales', 'Support', 'Operations'];
  const PRODUCTS = ['Pro Plan', 'Starter Kit', 'Enterprise Suite', 'Basic Package', 'Premium Bundle', 'Team Edition'];

  if (name.includes('email'))    return `${PEOPLE[seed % 6].split(' ')[0].toLowerCase()}@example.com`;
  if (name.includes('phone'))    return `+1 (${500 + seed}) ${200 + seed}-${1000 + seed * 7}`;
  if (name.includes('name') && (name.includes('full') || name.includes('first') || name === 'name'))
    return PEOPLE[seed % PEOPLE.length];
  if (name.includes('company') || name.includes('org') || name.includes('brand'))
    return COMPANIES[seed % COMPANIES.length];
  if (name.includes('city') || name.includes('location'))
    return CITIES[seed % CITIES.length];
  if (name.includes('address'))  return `${seed * 7 + 100} Oak ${['St', 'Ave', 'Blvd'][seed % 3]}`;
  if (name.includes('title') || name.includes('name'))
    return PRODUCTS[seed % PRODUCTS.length];
  if (name.includes('status'))   return STATUSES[seed % STATUSES.length];
  if (name.includes('category') || name.includes('tag') || name.includes('type') || name.includes('label'))
    return TAGS[seed % TAGS.length];
  if (name.includes('desc') || name.includes('note') || name.includes('comment') || name.includes('summary'))
    return `Sample ${name} for record ${seed}. This shows a realistic preview.`;
  if (name.includes('url') || name.includes('website') || name.includes('link'))
    return `https://example-${seed}.com`;
  if (name.includes('sku') || name.includes('code') || name.includes('id') || name.includes('ref'))
    return `${String.fromCharCode(65 + seed % 26)}${String.fromCharCode(65 + (seed + 2) % 26)}-${1000 + seed * 17}`;
  if (name.includes('priority'))
    return ['High', 'Medium', 'Low'][seed % 3];
  if (name.includes('color'))
    return ['#7c3aed', '#0891b2', '#059669', '#d97706', '#db2777'][seed % 5];
  if (name.includes('assign') || name.includes('owner') || name.includes('author'))
    return PEOPLE[(seed + 2) % PEOPLE.length].split(' ')[0];

  return `${fieldName} ${seed}`;
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
