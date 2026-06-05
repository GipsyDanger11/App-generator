'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';

// Lightweight SVG bar chart. Reads live data from the bound entity.
// props: { entity, field, groupBy, height }
import * as React from 'react';
import { LoadingState, ErrorState, EmptyState } from '../states';

export function Chart({ node, appId, entityName }: CompProps) {
  const t = useT();
  const entity = (node.props?.entity as string) ?? entityName;
  const field = node.props?.field as string | undefined;
  const groupBy = node.props?.groupBy as string | undefined;
  const height = Math.min(Math.max(Number(node.props?.height ?? 220), 80), 600);
  const [state, setState] = React.useState<{ loading: boolean; error: string | null; rows: Array<Record<string, unknown>> }>({ loading: true, error: null, rows: [] });
  React.useEffect(() => {
    if (!entity) { setState({ loading: false, error: 'No entity bound', rows: [] }); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/apps/${appId}/entities/${encodeURIComponent(entity)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.records ?? []);
        if (!cancelled) setState({ loading: false, error: null, rows });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: (e as Error).message, rows: [] });
      }
    })();
    return () => { cancelled = true; };
  }, [appId, entity]);

  if (state.loading) return <LoadingState label="Loading chart…" />;
  if (state.error) return <ErrorState message={state.error} />;
  if (!state.rows.length) return <EmptyState title="No data yet" hint="Add records to see the chart." />;

  // Aggregate
  const buckets = new Map<string, number>();
  if (groupBy) {
    for (const r of state.rows) {
      const k = String((r as Record<string, unknown>)[groupBy] ?? '—');
      let n: number;
      if (field) n = Number((r as Record<string, unknown>)[field]) || 0;
      else n = 1;
      buckets.set(k, (buckets.get(k) ?? 0) + (field ? n : 1));
    }
  } else if (field) {
    for (const r of state.rows) {
      const n = Number((r as Record<string, unknown>)[field]) || 0;
      buckets.set(`#${buckets.size + 1}`, n);
    }
  } else {
    buckets.set('Records', state.rows.length);
  }
  const data = Array.from(buckets.entries());
  const max = Math.max(1, ...data.map(([, v]) => v));
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium text-slate-700 mb-2">{t((node.props?.title as string) ?? '', (node.props?.title as string) ?? 'Chart')}</div>
      <svg viewBox={`0 0 ${Math.max(120, data.length * 60)} ${height}`} className="w-full">
        {data.map(([k, v], i) => {
          const w = 40; const gap = 16; const x = i * (w + gap) + 10;
          const h = (v / max) * (height - 40);
          const y = height - h - 20;
          return (
            <g key={k}>
              <rect x={x} y={y} width={w} height={h} rx={4} className="fill-brand-600" />
              <text x={x + w / 2} y={y - 4} textAnchor="middle" className="fill-slate-700 text-[10px]">{v}</text>
              <text x={x + w / 2} y={height - 4} textAnchor="middle" className="fill-slate-500 text-[10px]">{k.slice(0, 8)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
