'use client';
// Form component: creates or updates a record for a bound entity.
// props: { entity, mode: 'create' | 'edit', recordId, onSuccess? }
import * as React from 'react';
import { CompProps } from '../registry';
import { LoadingState, ErrorState } from '../states';
import { useRouter } from 'next/navigation';
import { useAppConfig } from '../AppConfigContext';

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
  const isPreview = appId === 'preview';
  const appConfig = useAppConfig();
  
  const [schema, setSchema] = React.useState<EntitySchema | null>(null);
  const [loading, setLoading] = React.useState(!isPreview);

  // Builder preview — show actual form fields from entity config
  if (isPreview && appConfig) {
    const entityDef = appConfig.entities.find((e) => e.name === entity);
    if (entityDef) {
      return <FormPreview entity={entityDef} mode={mode} />;
    }
    
    return (
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50/40 p-6 text-center">
        <div className="text-sm font-medium text-purple-700 mb-1">Form · <code className="text-xs bg-purple-100 px-1 rounded">{entity}</code></div>
        <p className="text-xs text-slate-500">Entity not found in config.</p>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50/40 p-6 text-center">
        <div className="text-sm font-medium text-purple-700 mb-1">Form · <code className="text-xs bg-purple-100 px-1 rounded">{entity}</code></div>
        <p className="text-xs text-slate-500">Save the app to create records here.</p>
      </div>
    );
  }
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
      {/* Breadcrumb */}
      {successRoute && (
        <div className="mb-4 pb-4 border-b border-slate-200">
          <a href={successRoute} className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to list
          </a>
        </div>
      )}
      
      {schema.fields.map((f) => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
      <div className="flex items-center gap-3 pt-2">
        <button 
          type="submit" 
          disabled={submitting} 
          className="rounded-md bg-brand-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm hover:shadow"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving…
            </span>
          ) : (
            mode === 'edit' ? 'Update' : 'Create'
          )}
        </button>
        {successRoute && (
          <a 
            href={successRoute} 
            className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}

// Preview component for builder
function FormPreview({ entity, mode }: { entity: any; mode: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
      <div className="mb-4 pb-4 border-b border-slate-200 bg-purple-50/30 -m-6 p-6">
        <div className="text-sm text-brand-600 flex items-center gap-1 opacity-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to list (preview)
        </div>
      </div>
      
      {entity.fields.map((f: any) => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {f.label ?? f.name}{f.required && <span className="text-red-500"> *</span>}
          </label>
          <PreviewFieldInput field={f} />
          {f.helpText && <p className="text-xs text-slate-500 mt-1">{f.helpText}</p>}
        </div>
      ))}
      
      <div className="flex items-center gap-3 pt-2">
        <button 
          disabled 
          className="rounded-md bg-brand-600 text-white px-6 py-2.5 text-sm font-medium opacity-75"
        >
          {mode === 'edit' ? 'Update' : 'Create'}
        </button>
        <button 
          disabled 
          className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 opacity-75"
        >
          Cancel
        </button>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200 bg-purple-50/20 -mx-6 -mb-6 px-6 py-3 text-xs text-center text-purple-700 rounded-b-lg">
        ✏️ Preview Mode - Save the app to create/edit records
      </div>
    </div>
  );
}

// Preview field inputs (disabled)
function PreviewFieldInput({ field }: { field: any }) {
  const baseCls = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white/50 text-slate-500';
  
  switch (field.type) {
    case 'text':
      return <textarea disabled className={baseCls} rows={4} placeholder={field.placeholder || 'Enter text...'} />;
    case 'number':
      return <input disabled type="number" className={baseCls} placeholder={field.placeholder || '0'} />;
    case 'boolean':
      return <input disabled type="checkbox" />;
    case 'date':
      return <input disabled type="date" className={baseCls} />;
    case 'datetime':
      return <input disabled type="datetime-local" className={baseCls} />;
    case 'email':
      return <input disabled type="email" className={baseCls} placeholder={field.placeholder || 'email@example.com'} />;
    case 'select':
      return (
        <select disabled className={baseCls}>
          <option>—</option>
          {(field.options ?? []).map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'multiselect':
      return (
        <select disabled multiple className={baseCls}>
          {(field.options ?? []).map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'json':
      return <textarea disabled className={baseCls + ' font-mono'} rows={4} placeholder='{"key":"value"}' />;
    default:
      return <input disabled type="text" className={baseCls} placeholder={field.placeholder || `Enter ${field.label || field.name}...`} />;
  }
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
