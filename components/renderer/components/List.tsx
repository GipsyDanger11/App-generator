'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';

export function List({ node }: CompProps) {
  const t = useT();
  const items = (Array.isArray(node.props?.items) ? node.props?.items : []) as string[];
  const ordered = (node.props?.ordered as boolean) ?? false;
  const Tag = (ordered ? 'ol' : 'ul') as 'ol' | 'ul';
  return (
    <Tag className={ordered ? 'list-decimal pl-5 space-y-1 text-slate-700' : 'list-disc pl-5 space-y-1 text-slate-700'}>
      {items.map((it, i) => <li key={i}>{t(it, it)}</li>)}
    </Tag>
  );
}
