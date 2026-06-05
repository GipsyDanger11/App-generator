// Helper: load an app + parse its config. Always returns a safe config.
import { prisma } from './prisma';
import { parseConfig } from './config/parser';
import type { AppConfig, EntityDef } from './config/types';
import { getSessionUser } from './session';

export async function loadApp(appId: string, opts: { requireOwner?: boolean } = {}) {
  const user = await getSessionUser();
  if (!user) return { error: 'Unauthorized', status: 401 } as const;
  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return { error: 'App not found', status: 404 } as const;
  if (opts.requireOwner && app.ownerId !== user.id) return { error: 'Forbidden', status: 403 } as const;
  // User-scoped: any logged-in user can read a public app, but writes are
  // restricted to owner. For simplicity here: read = any logged-in user,
  // write = owner only. Adjust in production.
  return { app, user, config: parseConfig(app.config) as AppConfig } as const;
}

export function findEntity(config: AppConfig, name: string | null | undefined): EntityDef | null {
  if (!name) return null;
  const n = String(name).toLowerCase();
  return config.entities.find((e) => e.name.toLowerCase() === n) ?? null;
}
