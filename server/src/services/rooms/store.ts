import { deleteManyFromR2 } from '../../utils/storage.js';
import type { RoomInstance } from '../../types/room.js';

/**
 * Live room state — in-process, never Redis, never Mongo.
 *
 * Redis commands are the scarcest free resource and a room message is the
 * highest-frequency event in the system, so room messages cost zero Redis
 * commands. The stated trade-off: a restart drops every instance (clients
 * auto-rejoin; rings start empty). Single-node only — a second node needs the
 * Socket.IO Redis adapter plus a shared instance directory.
 */
export const instances = new Map<string, RoomInstance>();

/**
 * Monotonic per-slug counter: `#n` is never reused while the process lives, so
 * a new instance can never overwrite a full one that merely has a lower number
 * free (counting live instances did exactly that after #1 emptied). One int per
 * slug — slugs are a bounded set.
 */
export const instanceCounters = new Map<string, number>();

export const nextInstanceNumber = (slug: string): number => {
  const n = (instanceCounters.get(slug) ?? 0) + 1;
  instanceCounters.set(slug, n);
  return n;
};

/**
 * Observers told when an instance ceases to exist (emptied, admin-closed,
 * cleared). Lets mutes, report counts, bot cursors and presence throttles
 * prune themselves without the registry importing them.
 */
const closedListeners = new Set<(instanceId: string) => void>();

export const onInstanceClosed = (listener: (instanceId: string) => void): void => {
  closedListeners.add(listener);
};

export const dropInstance = (instanceId: string): void => {
  const inst = instances.get(instanceId);
  // Room photos are as ephemeral as the room: every key signed here goes with it
  // (reported ones were copied to `ww/kept/` when the report was filed).
  if (inst && inst.uploads.size > 0) void deleteManyFromR2([...inst.uploads]);
  instances.delete(instanceId);
  for (const listener of closedListeners) listener(instanceId);
};

/**
 * Observers told after a seat is added or removed in a template's instances
 * (join, leave, kick, close). Lets mod-presence follow the registry without
 * the registry importing it.
 */
const seatListeners = new Set<(slug: string) => void>();

export const onSeatChange = (listener: (slug: string) => void): void => {
  seatListeners.add(listener);
};

export const notifySeatChange = (slug: string): void => {
  for (const listener of seatListeners) listener(slug);
};
