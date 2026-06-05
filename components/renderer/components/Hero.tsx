'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';

export function Hero({ node, children }: CompProps) {
  const t = useT();
  const title = t(node.props?.title as string, (node.props?.title as string) ?? '');
  const subtitle = t(node.props?.subtitle as string, (node.props?.subtitle as string) ?? '');
  const cta = node.props?.cta as { label?: string; href?: string } | undefined;
  return (
    <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 text-white p-8 md:p-12 shadow-sm">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title || 'Welcome'}</h1>
      {subtitle && <p className="mt-3 text-white/80 max-w-2xl">{subtitle}</p>}
      {children}
      {cta?.label && (
        <a href={cta.href ?? '#'} className="inline-block mt-6 rounded-md bg-white text-brand-700 px-4 py-2 text-sm font-medium hover:bg-brand-50">
          {cta.label}
        </a>
      )}
    </section>
  );
}
