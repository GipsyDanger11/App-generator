// Reusable animated wave background. Sits at the bottom of any container.
import * as React from 'react';

interface Props { className?: string }

export function Waves({ className = '' }: Props) {
  // Two copies of the same path so we can slide it for a seamless loop.
  const path = 'M0,80 C240,140 480,20 720,80 C960,140 1200,20 1440,80 L1440,200 L0,200 Z';
  return (
    <div className={`waves ${className}`} aria-hidden>
      <svg className="wave-3" viewBox="0 0 2880 200" preserveAspectRatio="none">
        <path d={path} fill="#a78bfa" />
        <path d={path} fill="#a78bfa" transform="translate(1440,0)" />
      </svg>
      <svg className="wave-2" viewBox="0 0 2880 200" preserveAspectRatio="none">
        <path d={path} fill="#c4b5fd" />
        <path d={path} fill="#c4b5fd" transform="translate(1440,0)" />
      </svg>
      <svg className="wave-1" viewBox="0 0 2880 200" preserveAspectRatio="none">
        <path d={path} fill="#ddd6fe" />
        <path d={path} fill="#ddd6fe" transform="translate(1440,0)" />
      </svg>
    </div>
  );
}

export function WaveHero({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`wave-bg relative overflow-hidden text-white ${className}`}>
      {/* Floating blobs */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-fuchsia-500/30 blur-3xl blob" />
      <div className="absolute top-32 right-0 w-96 h-96 rounded-full bg-indigo-400/30 blur-3xl blob-2" />
      <div className="relative z-10">{children}</div>
      <Waves />
    </div>
  );
}
