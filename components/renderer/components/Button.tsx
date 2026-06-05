'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';

export function Button({ node }: CompProps) {
  const t = useT();
  const label = t((node.props?.label as string) ?? '', (node.props?.label as string) ?? 'Button');
  const href = (node.props?.href as string) ?? '#';
  const variant = (node.props?.variant as string) ?? 'primary';
  const cls = variant === 'secondary'
    ? 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'
    : variant === 'danger'
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-brand-600 text-white hover:bg-brand-700';
  return <a href={href} className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${cls}`}>{label}</a>;
}
