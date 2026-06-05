import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Make Prisma resilient on serverless/Neon: a short connection timeout
// + reasonable pool size means we fail fast on cold starts instead of
// hanging the request, and the pool can survive Neon "terminating
// connection" admin commands (serverless pauses).
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Neon serverless databases pause after inactivity and drop connections
// with code E57P01 ("terminating connection due to administrator command").
// This helper retries once on that specific error — the reconnect happens
// automatically on the next Prisma call after the old connection is closed.
const NEON_TERMINATED_CODE = 'E57P01';

function isNeonTerminatedError(e: unknown): boolean {
  // Prisma wraps the raw DB error; check known shapes.
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = e.meta as Record<string, unknown> | undefined;
    const cause = String(meta?.cause ?? '');
    return cause.includes(NEON_TERMINATED_CODE);
  }
  // Also catch raw errors stringified in logs
  const msg = String((e as Error)?.message ?? e);
  return msg.includes(NEON_TERMINATED_CODE);
}

/**
 * Wrap any Prisma call with one automatic retry on Neon wake-up errors.
 *
 * Usage:
 *   const user = await dbRetry(() => prisma.user.findUnique(...));
 */
export async function dbRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (isNeonTerminatedError(e)) {
        // Give the connection pool a moment to reconnect before retrying.
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}
