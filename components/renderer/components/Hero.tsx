'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';

export function Hero({ node, children }: CompProps) {
  const t = useT();
  const title = t(node.props?.title as string, (node.props?.title as string) ?? '');
  const subtitle = t(node.props?.subtitle as string, (node.props?.subtitle as string) ?? '');
  const cta = node.props?.cta as { label?: string; href?: string } | undefined;

  // Use the app-level CSS variable if set (injected by AppRunner from theme.primary),
  // otherwise fall back to the default brand gradient.
  const style = {
    background: 'linear-gradient(135deg, var(--app-primary, #7c3aed) 0%, color-mix(in srgb, var(--app-primary, #4c1d95) 60%, #000 40%) 100%)',
  } as React.CSSProperties;

  return (
    <section
      className="rounded-2xl text-white p-8 md:p-12 shadow-sm"
      style={style}
    >
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title || 'Welcome'}</h1>
      {subtitle && <p className="mt-3 text-white/80 max-w-2xl">{subtitle}</p>}
      {children}
      {cta?.label && (
        <a
          href={cta.href ?? '#'}
          className="inline-block mt-6 rounded-md bg-white px-4 py-2 text-sm font-medium hover:opacity-90"
          style={{ color: 'var(--app-primary, #7c3aed)' }}
        >
          {cta.label}
        </a>
      )}
    </section>
  );
}
