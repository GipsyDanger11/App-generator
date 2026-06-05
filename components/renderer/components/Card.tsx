'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';

export function Card({ node, children }: CompProps) {
  const t = useT();
  const title = t((node.props?.title as string) ?? '', (node.props?.title as string) ?? '');
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {title && <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>}
      <div className="text-slate-700">{children}</div>
    </div>
  );
}
