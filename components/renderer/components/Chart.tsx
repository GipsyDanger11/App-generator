'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';
import { useAppConfig } from '../AppConfigContext';

// Lightweight SVG bar chart. Reads live data from the bound entity.
// props: { entity, field, groupBy, height }
import * as React from 'react';
import { LoadingState, ErrorState, EmptyState } from '../states';

// Seeded pseudo-random for stable preview data
function seeded(label: string, idx: number, min: number, max: number): number {
  const seed = label.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + idx * 37;
  return min + (seed % (max - min + 1));
}

const BAR_COLORS = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#db2777', '#6366f1', '#0d9488'];

export function Chart({ node, appId, entityName }: CompProps) {
  const t = useT();
  const entity = (node.props?.entity as string) ?? entityName;
  const field = node.props?.field as string | undefined;
  const groupBy = node.props?.groupBy as string | undefined;
  const height = Math.min(Math.max(Number(node.props?.height ?? 260), 80), 600);
  const isPreview = appId === 'preview';
  const appConfig = useAppConfig();
  const [state, setState] = React.useState<{ loading: boolean; error: string | null; rows: Array<Record<string, unknown>> }>({ loading: !isPreview, error: null, rows: [] });

  // Preview mode: show realistic mock chart
  if (isPreview) {
    const entityDef = appConfig?.entities.find((e) => e.name === entity);
    const labels = groupBy && entityDef
      ? entityDef.fields.find(f => f.name === groupBy)?.options?.map(o => o.label).slice(0, 6)
      : null;
    const mockLabels = labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const mockData = mockLabels.map((label, i) => ({
      label,
      value: seeded(entity || 'chart', i, 15, 95),
    }));
    const max = Math.max(1, ...mockData.map(d => d.value));
    const chartTitle = t((node.props?.title as string) ?? '', (node.props?.title as string) ?? `${entity} Overview`);

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">{chartTitle}</h3>
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">Preview</span>
        </div>
        <svg viewBox={`0 0 ${Math.max(300, mockData.length * 56)} ${height}`} className="w-full" role="img" aria-label="Bar chart preview">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = height - 30 - pct * (height - 50);
            return (
              <g key={pct}>
                <line x1="40" y1={y} x2={Math.max(300, mockData.length * 56) - 10} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x="36" y={y + 4} textAnchor="end" className="fill-slate-400" style={{ fontSize: '10px' }}>
                  {Math.round(max * pct)}
                </text>
              </g>
            );
          })}
          {/* Bars */}
          {mockData.map((d, i) => {
            const barW = 36;
            const gap = 20;
            const x = 50 + i * (barW + gap);
            const barH = (d.value / max) * (height - 60);
            const y = height - barH - 30;
            const color = BAR_COLORS[i % BAR_COLORS.length];
            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={6}
                  fill={color}
                  opacity={0.85}
                  className="transition-opacity hover:opacity-100"
                >
                  <title>{d.label}: {d.value}</title>
                </rect>
                {/* Value label on top */}
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="fill-slate-600" style={{ fontSize: '11px', fontWeight: 600 }}>
                  {d.value}
                </text>
                {/* X-axis label */}
                <text x={x + barW / 2} y={height - 10} textAnchor="middle" className="fill-slate-500" style={{ fontSize: '10px' }}>
                  {d.label.slice(0, 8)}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-center text-purple-600 opacity-60">
          📊 Preview Mode — Save the app to see real chart data
        </div>
      </div>
    );
  }

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
  const chartTitle = t((node.props?.title as string) ?? '', (node.props?.title as string) ?? 'Chart');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-800 mb-4">{chartTitle}</div>
      <svg viewBox={`0 0 ${Math.max(200, data.length * 56)} ${height}`} className="w-full" role="img" aria-label="Data chart">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = height - 30 - pct * (height - 50);
          return (
            <g key={pct}>
              <line x1="40" y1={y} x2={Math.max(200, data.length * 56) - 10} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x="36" y={y + 4} textAnchor="end" className="fill-slate-400" style={{ fontSize: '10px' }}>
                {Math.round(max * pct)}
              </text>
            </g>
          );
        })}
        {data.map(([k, v], i) => {
          const w = 36; const gap = 20; const x = 50 + i * (w + gap);
          const h = (v / max) * (height - 60);
          const y = height - h - 30;
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <g key={k}>
              <rect x={x} y={y} width={w} height={h} rx={6} fill={color} opacity={0.85} className="transition-opacity hover:opacity-100">
                <title>{k}: {v}</title>
              </rect>
              <text x={x + w / 2} y={y - 6} textAnchor="middle" className="fill-slate-600" style={{ fontSize: '11px', fontWeight: 600 }}>{v}</text>
              <text x={x + w / 2} y={height - 10} textAnchor="middle" className="fill-slate-500" style={{ fontSize: '10px' }}>{k.slice(0, 8)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
