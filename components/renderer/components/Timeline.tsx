'use client';
import * as React from 'react';
import { CompProps } from '../registry';
import { useAppConfig } from '../AppConfigContext';
import { LoadingState, ErrorState, EmptyState } from '../states';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';

/**
 * Timeline — date-sorted card list view for entity records.
 * props: { entity, dateField, titleField, descriptionField }
 */
export function Timeline({ node, appId, entityName }: CompProps) {
  const entity = (node.props?.entity as string) ?? entityName;
  const dateField = (node.props?.dateField as string) ?? 'createdAt';
  const titleField = (node.props?.titleField as string) ?? 'name';
  const descField = (node.props?.descriptionField as string) ?? '';
  const isPreview = appId === 'preview';
  const appConfig = useAppConfig();

  const [state, setState] = React.useState<{
    loading: boolean;
    error: string | null;
    rows: Array<Record<string, unknown>>;
  }>({ loading: !isPreview, error: null, rows: [] });

  // Preview mode: show mock timeline
  if (isPreview) {
    const mockItems = [
      { [titleField]: 'Project kickoff meeting', [dateField]: '2024-01-15', [descField]: 'Initial planning and requirements gathering with the team.' },
      { [titleField]: 'Design review completed', [dateField]: '2024-01-12', [descField]: 'All mockups approved by stakeholders.' },
      { [titleField]: 'Database schema finalized', [dateField]: '2024-01-10', [descField]: 'Entity relationships and field types confirmed.' },
      { [titleField]: 'Sprint planning session', [dateField]: '2024-01-08', [descField]: 'Tasks assigned and timeline established.' },
      { [titleField]: 'Repository created', [dateField]: '2024-01-05', [descField]: 'GitHub repo set up with CI/CD pipeline.' },
    ];

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-600" />
            {entity} Timeline
          </h3>
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">Preview</span>
        </div>
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-brand-400 via-brand-300 to-brand-100 rounded-full" />
          <div className="space-y-4">
            {mockItems.map((item, i) => (
              <div key={i} className="relative">
                {/* Dot on the line */}
                <div className="absolute -left-[18px] top-2 w-3 h-3 rounded-full border-2 border-brand-500 bg-white" />
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-slate-800">{item[titleField] as string}</div>
                    <div className="shrink-0 flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {item[dateField] as string}
                    </div>
                  </div>
                  {descField && item[descField] && (
                    <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item[descField] as string}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-center text-purple-600 opacity-60">
          🕐 Preview Mode — Save the app to see real timeline data
        </div>
      </div>
    );
  }

  // Live mode
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    if (!entity) { setState({ loading: false, error: 'No entity bound', rows: [] }); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/apps/${appId}/entities/${encodeURIComponent(entity)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.records ?? []);
        // Sort by date field descending
        rows.sort((a: any, b: any) => {
          const da = new Date(a[dateField] || 0).getTime();
          const db = new Date(b[dateField] || 0).getTime();
          return db - da;
        });
        if (!cancelled) setState({ loading: false, error: null, rows });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: (e as Error).message, rows: [] });
      }
    })();
    return () => { cancelled = true; };
  }, [appId, entity, dateField]);

  if (state.loading) return <LoadingState label="Loading timeline…" />;
  if (state.error) return <ErrorState message={state.error} />;
  if (!state.rows.length) return <EmptyState title="No events yet" hint="Add records to see the timeline." />;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-brand-600" />
        {entity} Timeline
      </h3>
      <div className="relative pl-6">
        <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-brand-400 via-brand-300 to-brand-100 rounded-full" />
        <div className="space-y-4">
          {state.rows.map((item, i) => (
            <div key={(item.id as string) ?? i} className="relative">
              <div className="absolute -left-[18px] top-2 w-3 h-3 rounded-full border-2 border-brand-500 bg-white" />
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-slate-800">{String(item[titleField] ?? `Event ${i + 1}`)}</div>
                  {item[dateField] ? (
                    <div className="shrink-0 flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(String(item[dateField]))}
                    </div>
                  ) : null}
                </div>
                {descField && item[descField] ? (
                  <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{String(item[descField])}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
