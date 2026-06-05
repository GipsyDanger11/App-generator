'use client';
// The core renderer. Recursively renders a ComponentNode tree using a
// component registry. Unknown kinds fall back to <UnknownComponent /> so
// a bad config never crashes the UI.

import type { ComponentNode } from '@/lib/config/types';
import { componentRegistry, UnknownComponent, ErrorBoundary } from './registry';
import { LoadingState, ErrorState } from './states';

interface Props {
  node: ComponentNode | null | undefined;
  appId: string;
  entityName?: string;
  // optional data context to pass to data-aware components (table/form)
  recordId?: string;
}

export function Renderer({ node, appId, entityName, recordId }: Props) {
  if (!node || typeof node !== 'object') return <UnknownComponent />;
  const Comp = componentRegistry[node.kind];
  if (!Comp) return <UnknownComponent kind={node.kind} />;
  const children = node.children?.map((c, i) => (
    <Renderer key={(c.id as string) ?? i} node={c} appId={appId} entityName={entityName} recordId={recordId} />
  ));
  // Special: the `form` and `table` components are async/data-aware. They
  // receive a `data` prop fetched by their own hooks — handled inside.
  return (
    <ErrorBoundary fallback={(err) => <ErrorState message={String(err.message ?? err)} />}>
      {/* eslint-disable-next-line react/no-children-prop */}
      <Comp node={node} appId={appId} entityName={entityName} recordId={recordId} children={children} />
    </ErrorBoundary>
  );
}

export { LoadingState, ErrorState };
