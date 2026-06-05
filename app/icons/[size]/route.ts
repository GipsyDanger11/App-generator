// Server-rendered PNG icon. Brand color background + sparkle.
export const dynamic = 'force-static';

function makePng(size: number, label = '✨') {
  // We use a tiny hand-rolled PNG generator: an SVG image is converted to
  // a data URL by the browser. But this is a Route Handler that returns
  // raw SVG, served from /icons/icon-{size}.svg. The manifest is updated
  // to reference these.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#7c3aed"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-size="${size * 0.5}" font-family="system-ui, Apple Color Emoji, Segoe UI Emoji, sans-serif" fill="white">${label}</text>
</svg>`;
  return svg;
}

export function GET(_req: Request, { params }: { params: { size: string } }) {
  const size = Math.min(Math.max(Number(params.size) || 192, 32), 1024);
  const body = makePng(size);
  return new Response(body, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' } });
}
