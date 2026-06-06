'use client';
import { CompProps } from '../registry';

export function Divider({ node }: CompProps) {
  const label = (node.props?.label as string) ?? '';
  
  if (label) {
    return (
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2">{label}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      </div>
    );
  }
  
  return <hr className="my-6 border-none h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />;
}

export function Spacer({ node }: CompProps) {
  const h = Math.min(Math.max(Number(node.props?.height ?? 24), 4), 200);
  return <div style={{ height: h }} aria-hidden />;
}
