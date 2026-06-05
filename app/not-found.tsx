// Tiny SVG -> PNG generator using a 1x1 canvas. Most browsers can render this
// to a 192/512 PNG via the canvas API. Here we just provide simple SVG icons
// and let the manifest reference them — but PWA install requires PNG.
//
// To keep this zero-deps, we ship an inline PNG generator route that returns
// a brand-colored PNG. In production, replace with proper assets.

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-slate-600 mt-2">This page doesn&apos;t exist.</p>
        <Link href="/" className="btn mt-4 inline-flex">Go home</Link>
      </div>
    </main>
  );
}
