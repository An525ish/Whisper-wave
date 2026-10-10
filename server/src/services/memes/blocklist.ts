/**
 * In-memory joke-id blocklist — the server side of report/hide.
 *
 * The client hides reported memes locally at once; this set keeps them out
 * of every future batch. Process memory is fine: ids are small integers, the
 * set only grows by human action, and losing it on restart merely un-hides
 * until re-reported. Admin adds/removes ids (see `controllers/admin/memes.ts`).
 */
const blocked = new Set<number>();

export const blockJokeId = (id: number): void => {
  blocked.add(id);
};

export const unblockJokeId = (id: number): boolean => blocked.delete(id);

export const isJokeBlocked = (id: number): boolean => blocked.has(id);

export const listBlockedJokeIds = (): number[] => [...blocked].sort((a, b) => a - b);
