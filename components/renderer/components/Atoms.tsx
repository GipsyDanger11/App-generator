'use client';
import { CompProps } from '../registry';

export function Divider(_: CompProps) { return <hr className="my-4 border-slate-200" />; }
export function Spacer({ node }: CompProps) {
  const h = Math.min(Math.max(Number(node.props?.height ?? 24), 4), 200);
  return <div style={{ height: h }} aria-hidden />;
}
