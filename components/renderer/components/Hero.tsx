'use client';
import * as React from 'react';
import { CompProps } from '../registry';
import { useT } from '../useT';

/**
 * Hero section with animated floating particles, richer gradient,
 * larger typography, and optional action buttons from page config.
 */
export function Hero({ node, children }: CompProps) {
  const t = useT();
  const title = t(node.props?.title as string, (node.props?.title as string) ?? '');
  const subtitle = t(node.props?.subtitle as string, (node.props?.subtitle as string) ?? '');
  const cta = node.props?.cta as { label?: string; href?: string } | undefined;
  const actions = node.props?.actions as Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }> | undefined;

  // Use the app-level CSS variable if set (injected by AppRunner from theme.primary),
  // otherwise fall back to the default brand gradient.
  const style = {
    background: 'linear-gradient(135deg, var(--app-primary, #7c3aed) 0%, color-mix(in srgb, var(--app-primary, #4c1d95) 60%, #000 40%) 100%)',
  } as React.CSSProperties;

  return (
    <section
      className="hero-section rounded-2xl text-white p-10 md:p-16 shadow-lg relative overflow-hidden"
      style={style}
    >
      {/* Animated floating particles */}
      <div className="hero-particles" aria-hidden>
        <span className="hero-particle hero-particle-1" />
        <span className="hero-particle hero-particle-2" />
        <span className="hero-particle hero-particle-3" />
        <span className="hero-particle hero-particle-4" />
        <span className="hero-particle hero-particle-5" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          {title || 'Welcome'}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}

        {/* Action buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {cta?.label && (
            <a
              href={cta.href ?? '#'}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              style={{ color: 'var(--app-primary, #7c3aed)' }}
            >
              {cta.label}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          )}
          {actions?.map((action, i) => (
            <a
              key={i}
              href={action.href}
              className={
                action.variant === 'secondary'
                  ? 'inline-flex items-center gap-2 rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200'
                  : 'inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200'
              }
              style={action.variant !== 'secondary' ? { color: 'var(--app-primary, #7c3aed)' } : undefined}
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
