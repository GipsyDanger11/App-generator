// Helper: unwrap route handler `params` which may be a plain object
// (Next.js 14) or a Promise (Next.js 15+). Always returns a record.

type Primitive = string | number | boolean;
type Params = Record<string, Primitive | Primitive[] | undefined>;

export async function unwrapParams(input: Params | Promise<Params>): Promise<Params> {
  if (input && typeof (input as Promise<Params>).then === 'function') {
    return await (input as Promise<Params>);
  }
  return input as Params;
}

// Pull a single string param out, with safe fallback.
export function pickString(p: Params, key: string, fallback = ''): string {
  const v = p[key];
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return fallback;
}
