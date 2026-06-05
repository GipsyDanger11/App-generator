import { PrismaClient } from '@prisma/client';

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
