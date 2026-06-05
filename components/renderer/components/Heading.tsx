'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';

export function Heading({ node }: CompProps) {
  const t = useT();
  const text = t(node.props?.text as string, (node.props?.text as string) ?? '');
  const level = Math.min(Math.max(Number(node.props?.level ?? 2), 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
  const sizes: Record<number, string> = { 1: 'text-4xl', 2: 'text-2xl', 3: 'text-xl', 4: 'text-lg', 5: 'text-base', 6: 'text-sm' };
  const Tag = (`h${level}`) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return <Tag className={`font-semibold text-slate-900 ${sizes[level]} mt-4 mb-2`}>{text}</Tag>;
}
