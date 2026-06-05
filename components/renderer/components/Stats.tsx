'use client';
import * as React from 'react';
import { CompProps } from '../registry';
import { useT } from '../useT';

interface StatSource { entity: string; field?: string; op?: 'count' | 'sum' | 'avg' }
interface StatItemRaw { label?: string; value?: string; source?: StatSource }

export function Stats({ node, appId, entityName }: CompProps) {
  const t = useT();
  const raw = node.props?.items;
  const items: StatItemRaw[] = Array.isArray(raw) ? (raw as StatItemRaw[]) : [];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it, i) => (
        <StatItem key={i} item={it} t={t} appId={appId} defaultEntity={entityName} />
      ))}
    </div>
  );
}

function StatItem(props: { item: StatItemRaw; t: (k: string, fb?: string) => string; appId: string; defaultEntity?: string }) {
  const label = props.t(props.item.label || '', props.item.label || '');
  const source = props.item.source;
  if (!source || !source.entity) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{props.item.value || '\u2014'}</div>
      </div>
    );
  }
  return <LiveStat label={label} appId={props.appId} source={source} t={props.t} fallbackEntity={props.defaultEntity} />;
}

function LiveStat(props: { label: string; appId: string; source: StatSource; t: (k: string, fb?: string) => string; fallbackEntity?: string }) {
  const appId: string = props.appId;
  const source = props.source;
  const fallbackEntity = props.fallbackEntity;
  const entity = source.entity;
  const field = source.field;
  const op = source.op || 'count';
  const isPreview = appId === 'preview';
  const [val, setVal] = React.useState<string>(isPreview ? '—' : '\u2014');

  React.useEffect(() => {
    // In builder preview there is no real app — show a dash placeholder.
    if (isPreview) { setVal('—'); return; }
    const target: string = (entity || fallbackEntity || '') as string;
    if (!target) { setVal('\u2014'); return; }
    let cancelled = false;
    async function run() {
      try {
        const url = '/api/apps/' + appId + '/entities/' + encodeURIComponent(target);
        const res = await fetch(url);
        if (!res.ok) { if (!cancelled) setVal('\u2014'); return; }
        const data = await res.json();
        const rows: Array<Record<string, unknown>> = Array.isArray(data) ? data : (data && data.records ? data.records : []);
        let v = 0;
        if (op === 'count') {
          v = rows.length;
        } else if (field) {
          const nums: number[] = [];
          for (const r of rows) {
            const rec = r as Record<string, unknown>;
            const n = Number(rec[field as string]);
            if (!Number.isNaN(n)) nums.push(n);
          }
          if (op === 'sum') {
            v = 0;
            for (const n of nums) v = v + n;
          } else {
            v = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
          }
        }
        if (!cancelled) setVal(op === 'avg' ? v.toFixed(1) : String(v));
      } catch (_e) {
        if (!cancelled) setVal('\u2014');
      }
    }
    run();
    return function cleanup() { cancelled = true; };
  }, [appId, isPreview, entity, field, op, fallbackEntity]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{props.label || entity}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{val}</div>
    </div>
  );
}
