'use client';
// Form component: creates or updates a record for a bound entity.
// props: { entity, mode: 'create' | 'edit', recordId, onSuccess? }
import * as React from 'react';
import { CompProps } from '../registry';
import { LoadingState, ErrorState } from '../states';
import { useRouter } from 'next/navigation';

interface EntitySchema {
  name: string;
  fields: Array<{
    name: string; label?: string; type: string; required?: boolean;
    options?: Array<{ value: string; label: string }>;
    placeholder?: string; helpText?: string;
  }>;
}

export function Form({ node, appId, entityName }: CompProps) {
  const router = useRouter();
  const entity = (node.props?.entity as string) ?? entityName;
  const mode = (node.props?.mode as string) === 'edit' ? 'edit' : 'create';
  const recordId = (node.props?.recordId as string) ?? undefined;
  const successRoute = (node.props?.successRoute as string) ?? undefined;
  const [schema, setSchema] = React.useState<EntitySchema | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!entity) { setError('No entity bound to this form'); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const sRes = await fetch(`/api/apps/${appId}/entities/${encodeURIComponent(entity)}/schema`);
        if (!sRes.ok) throw new Error(`HTTP ${sRes.status}`);
        const s: EntitySchema = await sRes.json();
        if (cancelled) return;
        setSchema(s);
        // defaults
        const init: Record<string, unknown> = {};
        for (const f of s.fields) init[f.name] = '';
        setValues(init);
        if (mode === 'edit' && recordId) {
          const rRes = await fetch(`/api/apps/${appId}/entities/${encodeURIComponent(entity)}/${recordId}`);
          if (rRes.ok) {
            const row = await rRes.json();
            setValues((v) => ({ ...v, ...row.data }));
          }
        }
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setError((e as Error).message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [appId, entity, mode, recordId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schema) return;
    setSubmitting(true); setFieldErrors({}); setError(null);
    try {
      const url = mode === 'edit' && recordId
        ? `/api/apps/${appId}/entities/${encodeURIComponent(entity!)}/${recordId}`
        : `/api/apps/${appId}/entities/${encodeURIComponent(entity!)}`;
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j.fieldErrors) setFieldErrors(j.fieldErrors);
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      if (successRoute) router.push(successRoute); else router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error && !schema) return <ErrorState message={error} />;
  if (!schema) return <ErrorState message="Schema not found" />;

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
      {schema.fields.map((f) => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {f.label ?? f.name}{f.required && <span className="text-red-500"> *</span>}
          </label>
          <FieldInput
            field={f}
            value={values[f.name]}
            onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
          />
          {fieldErrors[f.name] && <p className="text-xs text-red-600 mt-1">{fieldErrors[f.name]}</p>}
          {f.helpText && <p className="text-xs text-slate-500 mt-1">{f.helpText}</p>}
        </div>
      ))}
      {error && <ErrorState message={error} />}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={submitting} className="rounded-md bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
          {submitting ? 'Saving…' : mode === 'edit' ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

function FieldInput({ field, value, onChange }: { field: EntitySchema['fields'][number]; value: unknown; onChange: (v: unknown) => void }) {
  const baseCls = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
  switch (field.type) {
    case 'text':
      return <textarea className={baseCls} rows={4} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
    case 'number':
      return <input type="number" className={baseCls} value={String(value ?? '')} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} placeholder={field.placeholder} />;
    case 'boolean':
      return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
    case 'date':
      return <input type="date" className={baseCls} value={String(value ?? '').slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
    case 'datetime':
      return <input type="datetime-local" className={baseCls} value={String(value ?? '').slice(0, 16)} onChange={(e) => onChange(e.target.value)} />;
    case 'email':
      return <input type="email" className={baseCls} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
    case 'select':
      return (
        <select className={baseCls} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'multiselect':
      return (
        <select multiple className={baseCls} value={Array.isArray(value) ? (value as string[]) : []} onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}>
          {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'json':
      return <textarea className={baseCls + ' font-mono'} rows={4} value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(e) => onChange(e.target.value)} placeholder='{"key":"value"}' />;
    default:
      return <input type="text" className={baseCls} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
  }
}
