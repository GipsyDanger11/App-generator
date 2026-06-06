'use client';
import * as React from 'react';
import { CompProps } from '../registry';
import { useAppConfig } from '../AppConfigContext';
import { LoadingState, ErrorState, EmptyState } from '../states';

/**
 * Kanban — renders entity records grouped by a select field as columns.
 * Drag-free but visually rich cards.
 * props: { entity, groupBy, titleField, descriptionField }
 */
export function Kanban({ node, appId, entityName }: CompProps) {
  const entity = (node.props?.entity as string) ?? entityName;
  const groupBy = (node.props?.groupBy as string) ?? 'status';
  const titleField = (node.props?.titleField as string) ?? 'name';
  const descField = (node.props?.descriptionField as string) ?? '';
  const isPreview = appId === 'preview';
  const appConfig = useAppConfig();

  const [state, setState] = React.useState<{
    loading: boolean;
    error: string | null;
    rows: Array<Record<string, unknown>>;
    columns: string[];
  }>({ loading: !isPreview, error: null, rows: [], columns: [] });

  // Preview mode: show mock kanban
  if (isPreview && appConfig) {
    const entityDef = appConfig.entities.find((e) => e.name === entity);
    const groupField = entityDef?.fields.find((f) => f.name === groupBy);
    const columns = groupField?.options?.map((o) => o.label) ?? ['To Do', 'In Progress', 'Done'];
    const mockCards = [
      { [titleField]: 'Design landing page', [groupBy]: columns[0], [descField]: 'Create mockups for the new landing' },
      { [titleField]: 'Set up database', [groupBy]: columns[0], [descField]: 'Configure PostgreSQL' },
      { [titleField]: 'Build API endpoints', [groupBy]: columns[1] ?? columns[0], [descField]: 'REST API for all entities' },
      { [titleField]: 'Write documentation', [groupBy]: columns[1] ?? columns[0], [descField]: 'API and user guides' },
      { [titleField]: 'Deploy to staging', [groupBy]: columns[2] ?? columns[0], [descField]: 'Set up CI/CD pipeline' },
    ];

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">📋 {entity} Board</h3>
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">Preview</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((col) => {
            const cards = mockCards.filter((c) => c[groupBy] === col);
            return (
              <div key={col} className="kanban-column shrink-0 w-64 rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">{col}</h4>
                  <span className="text-xs bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-500 font-medium">{cards.length}</span>
                </div>
                <div className="space-y-2.5">
                  {cards.map((card, i) => (
                    <div key={i} className="kanban-card rounded-lg bg-white border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200">
                      <div className="text-sm font-medium text-slate-800">{card[titleField] as string}</div>
                      {descField && card[descField] && (
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{card[descField] as string}</div>
                      )}
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-center text-purple-600 opacity-60">
          📋 Preview Mode — Save the app to see real board data
        </div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50/40 p-6 text-center">
        <div className="text-sm font-medium text-purple-700 mb-1">Kanban · <code className="text-xs bg-purple-100 px-1 rounded">{entity}</code></div>
        <p className="text-xs text-slate-500">Save the app to see board data.</p>
      </div>
    );
  }

  // Live mode
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    if (!entity) { setState({ loading: false, error: 'No entity bound', rows: [], columns: [] }); return; }
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
        let columns: string[] = [];
        if (schemaRes.ok) {
          const schema = await schemaRes.json();
          const gf = schema.fields?.find((f: any) => f.name === groupBy);
          if (gf?.options) columns = gf.options.map((o: any) => o.label ?? o.value);
        }
        if (!columns.length) {
          const unique = new Set<string>();
          rows.forEach((r: any) => { if (r[groupBy]) unique.add(String(r[groupBy])); });
          columns = Array.from(unique);
        }
        if (!cancelled) setState({ loading: false, error: null, rows, columns });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: (e as Error).message, rows: [], columns: [] });
      }
    })();
    return () => { cancelled = true; };
  }, [appId, entity, groupBy]);

  if (state.loading) return <LoadingState label="Loading board…" />;
  if (state.error) return <ErrorState message={state.error} />;
  if (!state.rows.length) return <EmptyState title="No records yet" hint="Add records to populate the board." />;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">📋 {entity} Board</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {state.columns.map((col) => {
          const cards = state.rows.filter((r) => String(r[groupBy] ?? '') === col);
          return (
            <div key={col} className="kanban-column shrink-0 w-64 rounded-lg bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">{col}</h4>
                <span className="text-xs bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-500 font-medium">{cards.length}</span>
              </div>
              <div className="space-y-2.5">
                {cards.map((card, i) => (
                  <div key={(card.id as string) ?? i} className="kanban-card rounded-lg bg-white border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200">
                    <div className="text-sm font-medium text-slate-800">{String(card[titleField] ?? `Item ${i + 1}`)}</div>
                    {descField && card[descField] ? (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">{String(card[descField])}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
