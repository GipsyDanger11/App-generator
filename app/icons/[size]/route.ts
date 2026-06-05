// Server-rendered PNG icon. Brand color background + sparkle.
export const dynamic = 'force-static';

import { unwrapParams, pickString } from '@/lib/routeParams';

function makeSvg(size: number, label = '\u2728') {
  // Use a circle + sparkle so the icon scales and works as a maskable PWA icon.
  const r = size * 0.46;
  const cx = size / 2;
  const cy = size / 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="50%" stop-color="#c026d3"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" fill-opacity="0.15"/>
  <text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle"
    font-size="${size * 0.45}" font-family="system-ui, Apple Color Emoji, Segoe UI Emoji, sans-serif" fill="white">${label}</text>
</svg>`;
}

export async function GET(_req: Request, ctx: { params: { size: string } | Promise<{ size: string }> }) {
  const params = await unwrapParams(ctx.params);
  const raw = pickString(params, 'size', '192');
  const n = Number(raw);
  const size = Number.isFinite(n) ? Math.min(Math.max(n, 32), 1024) : 192;
  const body = makeSvg(size);
  return new Response(body, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' } });
}
