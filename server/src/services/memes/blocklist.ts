import * as memeBlockRepo from '../../repositories/memeBlock.js';
import { logger } from '../../utils/logger.js';
import type { MemeBlockItem } from '../../types/memeBlock.js';

/**
 * Joke-id blocklist — the server side of report/hide.
 *
 * Mongo (`MemeBlock`) is the source of truth; this module is a thin cached
 * view so the feed hot path stays a synchronous `Set` lookup. The set is
 * hydrated lazily on first use, refreshed in the background every
 * `REFRESH_MS` (so other instances' writes land), and updated in place after
 * every local write. Bounded by `MAX_BLOCKED` — ids are small integers and
 * the provider pool is ~1.4k jokes.
 */
const MAX_BLOCKED = 5000;
const MAX_ADMIN_ROWS = 500;
const REFRESH_MS = 60_000;

const blocked = new Set<number>();
let loadedAt = 0;
let loading: Promise<void> | null = null;

const hydrate = async (): Promise<void> => {
  const ids = await memeBlockRepo.listBlockedIds('jokeapi', MAX_BLOCKED);
  blocked.clear();
  for (const id of ids) blocked.add(id);
  loadedAt = Date.now();
};

/**
 * Make sure the cached set has been loaded once; refresh it in the
 * background when stale. A failed load is logged and the feed carries on
 * with what it has (empty on a cold start) — it retries on the next call.
 */
export const ensureBlocklist = async (): Promise<void> => {
  const stale = Date.now() - loadedAt >= REFRESH_MS;
  if (!stale) return;
  loading ??= hydrate()
    .catch((err: unknown) => logger.error({ err }, 'Meme blocklist hydrate failed'))
    .finally(() => {
      loading = null;
    });
  // Cold start waits for the first load; later refreshes don't block callers.
  if (loadedAt === 0) await loading;
};

export const isJokeBlocked = (id: number): boolean => blocked.has(id);

/** Block one provider joke everywhere (admin, or the report threshold). */
export const blockJokeId = async (id: number, reason?: string): Promise<void> => {
  await memeBlockRepo.setBlocked(id, 'jokeapi', reason);
  if (blocked.size < MAX_BLOCKED) blocked.add(id);
};

/** Un-block and reset the report counter. False when it was not blocked. */
export const unblockJokeId = async (id: number): Promise<boolean> => {
  const lifted = await memeBlockRepo.clearBlocked(id, 'jokeapi');
  blocked.delete(id);
  return lifted;
};

/** Admin list: blocked first, then most-reported. */
export const listBlocklist = async (): Promise<{ ids: number[]; items: MemeBlockItem[] }> => {
  const rows = await memeBlockRepo.listForAdmin(MAX_ADMIN_ROWS);
  const items = rows.map((r) => ({
    id: r.externalId,
    reports: r.reports,
    blocked: r.blocked,
    ...(r.reason ? { reason: r.reason } : {}),
    updatedAt: r.updatedAt.toISOString(),
  }));
  return { ids: items.filter((i) => i.blocked).map((i) => i.id).sort((a, b) => a - b), items };
};
