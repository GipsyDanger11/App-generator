'use client';
import { CompProps } from '../registry';

export function Iframe({ node }: CompProps) {
  const src = (node.props?.src as string) ?? '';
  const title = (node.props?.title as string) ?? 'Embedded content';
  if (!src) return <div className="text-sm text-slate-500 italic">iframe: missing src</div>;
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200">
      <iframe src={src} title={title} className="w-full h-full" />
    </div>
  );
}
