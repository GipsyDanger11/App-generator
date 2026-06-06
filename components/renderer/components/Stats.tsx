'use client';
import * as React from 'react';
import { CompProps } from '../registry';
import { useT } from '../useT';
// AppConfig context available via useAppConfig if needed
import {
  Users, DollarSign, TrendingUp, CheckSquare, Package,
  BarChart2, Star, Calendar, Activity, Hash,
} from 'lucide-react';

interface StatSource { entity: string; field?: string; op?: 'count' | 'sum' | 'avg' }
interface StatItemRaw { label?: string; value?: string; source?: StatSource }

// Pick a lucide icon based on keyword matching in the label
function iconForLabel(label: string): React.ElementType {
  const l = label.toLowerCase();
  if (l.includes('user') || l.includes('customer') || l.includes('contact') || l.includes('member')) return Users;
  if (l.includes('revenue') || l.includes('amount') || l.includes('spend') || l.includes('cost') || l.includes('price') || l.includes('deal')) return DollarSign;
  if (l.includes('task') || l.includes('todo') || l.includes('done') || l.includes('complet')) return CheckSquare;
  if (l.includes('product') || l.includes('item') || l.includes('stock') || l.includes('inventory')) return Package;
  if (l.includes('rating') || l.includes('score') || l.includes('star') || l.includes('best')) return Star;
  if (l.includes('date') || l.includes('today') || l.includes('day') || l.includes('week')) return Calendar;
  if (l.includes('trend') || l.includes('growth') || l.includes('streak') || l.includes('avg')) return TrendingUp;
  if (l.includes('chart') || l.includes('stat') || l.includes('metric') || l.includes('total')) return BarChart2;
  if (l.includes('active') || l.includes('live') || l.includes('open') || l.includes('alert')) return Activity;
  return Hash;
}

// Seeded pseudo-random number so mock values are stable per label
function seedNum(label: string, min: number, max: number): number {
  const seed = label.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return min + (seed % (max - min + 1));
}

const ACCENT_COLORS = [
  { bar: '#7c3aed', bg: '#f5f3ff', text: '#5b21b6' },
  { bar: '#0891b2', bg: '#ecfeff', text: '#155e75' },
  { bar: '#059669', bg: '#ecfdf5', text: '#065f46' },
  { bar: '#d97706', bg: '#fffbeb', text: '#92400e' },
  { bar: '#db2777', bg: '#fdf2f8', text: '#831843' },
];

export function Stats({ node, appId, entityName }: CompProps) {
  const t = useT();
  const raw = node.props?.items;
  const items: StatItemRaw[] = Array.isArray(raw) ? (raw as StatItemRaw[]) : [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((it, i) => (
        <StatItem key={i} item={it} t={t} appId={appId} defaultEntity={entityName} colorIdx={i % ACCENT_COLORS.length} />
      ))}
    </div>
  );
}

function StatItem(props: {
  item: StatItemRaw;
  t: (k: string, fb?: string) => string;
  appId: string;
  defaultEntity?: string;
  colorIdx: number;
}) {
  const label = props.t(props.item.label || '', props.item.label || '');
  const source = props.item.source;
  const color = ACCENT_COLORS[props.colorIdx];
  const Icon = iconForLabel(label);

  if (!source || !source.entity) {
    return (
      <div className="stat-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm" style={{ '--stat-bar': color.bar } as React.CSSProperties}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
          <div className="rounded-lg p-1.5" style={{ background: color.bg }}>
            <Icon className="h-4 w-4" style={{ color: color.bar }} />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">{props.item.value || '—'}</div>
      </div>
    );
  }

  return (
    <LiveStat
      label={label}
      appId={props.appId}
      source={source}
      t={props.t}
      fallbackEntity={props.defaultEntity}
      color={color}
      Icon={Icon}
    />
  );
}

function LiveStat(props: {
  label: string;
  appId: string;
  source: StatSource;
  t: (k: string, fb?: string) => string;
  fallbackEntity?: string;
  color: typeof ACCENT_COLORS[number];
  Icon: React.ElementType;
}) {
  const { appId, source, color, Icon } = props;
  const entity = source.entity;
  const field = source.field;
  const op = source.op || 'count';
  const isPreview = appId === 'preview';

  // Mock value for preview — stable, seeded from label
  const mockVal = isPreview
    ? op === 'avg'
      ? (seedNum(props.label, 1, 50) / 10).toFixed(1)
      : String(seedNum(props.label, 3, 247))
    : null;

  const [val, setVal] = React.useState<string>(mockVal ?? '…');
  const [loading, setLoading] = React.useState(!isPreview);

  React.useEffect(() => {
    if (isPreview) return;
    const target = entity || props.fallbackEntity || '';
    if (!target) { setVal('—'); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/apps/${appId}/entities/${encodeURIComponent(target)}`);
        if (!res.ok) { if (!cancelled) { setVal('—'); setLoading(false); } return; }
        const data = await res.json();
        const rows: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.records ?? []);
        let v = 0;
        if (op === 'count') {
          v = rows.length;
        } else if (field) {
          const nums = rows.map((r) => Number(r[field])).filter((n) => !Number.isNaN(n));
          if (op === 'sum') v = nums.reduce((a, b) => a + b, 0);
          else if (nums.length) v = nums.reduce((a, b) => a + b, 0) / nums.length;
        }
        if (!cancelled) { setVal(op === 'avg' ? v.toFixed(1) : String(v)); setLoading(false); }
      } catch {
        if (!cancelled) { setVal('—'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [appId, isPreview, entity, field, op, props.fallbackEntity]);

  return (
    <div
      className="stat-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ '--stat-bar': color.bar } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 truncate pr-1">
          {props.label || entity}
        </span>
        <div className="rounded-lg p-1.5 shrink-0" style={{ background: color.bg }}>
          <Icon className="h-4 w-4" style={{ color: color.bar }} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 skeleton rounded" />
      ) : (
        <div className="text-2xl font-bold text-slate-900">{val}</div>
      )}
      {isPreview && (
        <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <TrendingUp className="h-3 w-3" />
          <span>Live data</span>
        </div>
      )}
    </div>
  );
}
