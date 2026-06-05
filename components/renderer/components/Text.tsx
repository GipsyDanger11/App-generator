'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';

export function Text({ node }: CompProps) {
  const t = useT();
  const text = t(node.props?.text as string, (node.props?.text as string) ?? '');
  return <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{text}</p>;
}
