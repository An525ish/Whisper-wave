import { v4 as uuid } from 'uuid';
import { ROOM_MSG_RING } from '../../constants/rooms.js';
import { ROOM_REACTION_KINDS_MAX } from '../../constants/room-reactions.js';
import { deleteManyFromR2 } from '../../utils/storage.js';
import { instances } from './store.js';
import type { LiveRoomMessage, RoomEvidenceWindow } from '../../types/room.js';

/**
 * Append to the ring. Ids are ALWAYS server-minted — a client-chosen id would
 * let a sender collide with (and target) someone else's message.
 */
export const appendMessage = (
  instanceId: string,
  message: Omit<LiveRoomMessage, 'id' | 'ts'> & { ts?: number }
): LiveRoomMessage | null => {
  const inst = instances.get(instanceId);
  if (!inst) return null;
  const full: LiveRoomMessage = { ...message, id: uuid(), ts: message.ts ?? Date.now() };
  inst.ring.push(full);
  if (inst.ring.length > ROOM_MSG_RING) {
    const evicted = inst.ring.splice(0, inst.ring.length - ROOM_MSG_RING);
    // A photo that scrolled out of history is gone for good: free the storage now.
    const keys = evicted.flatMap((m) => (m.media?.key ? [m.media.key] : []));
    for (const key of keys) inst.uploads.delete(key);
    if (keys.length > 0) void deleteManyFromR2(keys);
  }
  return full;
};

/** History. Hidden messages stay out unless a mod view asks for them (flagged). */
export const recentMessages = (
  instanceId: string,
  limit = ROOM_MSG_RING,
  includeHidden = false
): LiveRoomMessage[] => {
  const inst = instances.get(instanceId);
  if (!inst) return [];
  return (includeHidden ? inst.ring : inst.ring.filter((m) => !m.hidden)).slice(-limit);
};

/** Mod-remove (or auto-hide) a message. Never deletes — evidence survives. */
export const hideMessage = (instanceId: string, messageId: string): boolean => {
  const inst = instances.get(instanceId);
  const target = inst?.ring.find((m) => m.id === messageId);
  if (!inst || !target || target.hidden) return false;
  target.hidden = true;
  return true;
};

/** Mod `unhide`: restore a hidden message for everyone. */
export const unhideMessage = (instanceId: string, messageId: string): LiveRoomMessage | null => {
  const target = instances.get(instanceId)?.ring.find((m) => m.id === messageId);
  if (!target?.hidden) return null;
  delete target.hidden;
  return target;
};

/**
 * Evidence for a report: the target plus `radius` neighbours each side, from
 * the RAW ring — hidden messages included (a hidden message is exactly what
 * gets reported). Lines carry alias/text/ts only; the raw `target` (with
 * senderGid/senderUserId) is for server-side offender resolution and must never
 * reach a client or a snapshot. No target found → empty window.
 */
export const getEvidenceWindow = (
  instanceId: string,
  messageId: string,
  radius: number
): RoomEvidenceWindow => {
  const ring = instances.get(instanceId)?.ring ?? [];
  const index = ring.findIndex((m) => m.id === messageId);
  if (index === -1) return { items: [], target: null };
  const items = ring.slice(Math.max(0, index - radius), index + radius + 1).map((m) => ({
    id: m.id,
    alias: m.alias,
    text: m.text,
    ...(m.media ? { media: m.media } : {}),
    ts: m.ts,
    ...(m.hidden ? { hidden: true as const } : {}),
  }));
  return { items, target: ring[index] ?? null };
};

export const findMessage = (instanceId: string, messageId: string): LiveRoomMessage | null => {
  const inst = instances.get(instanceId);
  return inst?.ring.find((m) => m.id === messageId) ?? null;
};

/** Which live instance of this room holds the message (report path). */
export const findMessageInstance = (
  slug: string,
  messageId: string
): string | null => {
  for (const inst of instances.values()) {
    if (inst.slug === slug && inst.ring.some((m) => m.id === messageId)) return inst.id;
  }
  return null;
};

/**
 * Toggle one emoji reaction. One reaction per person, like the other chats: picking a
 * new emoji moves yours, picking the same one removes it. Returns per-emoji counts for
 * the message, or null when it is gone. Who-holds-what stays server-side.
 */
export const toggleReaction = (
  instanceId: string,
  key: string,
  messageId: string,
  reaction: string
): Record<string, number> | null => {
  // Scoped to this instance, and only seated members may react.
  if (!(instances.get(instanceId)?.members.has(key) ?? false)) return null;
  const target = findMessage(instanceId, messageId);
  if (!target || target.hidden) return null;
  const had = target.reactions?.[reaction]?.includes(key) ?? false;
  // Everyone else's reactions stay; mine is dropped from every emoji first.
  const next: Record<string, string[]> = {};
  for (const [name, members] of Object.entries(target.reactions ?? {})) {
    const rest = members.filter((m) => m !== key);
    if (rest.length > 0) next[name] = rest;
  }
  if (!had) {
    // Cap distinct emoji per message; at the cap a brand-new one is ignored (mine was already moved).
    if (!(reaction in next) && Object.keys(next).length >= ROOM_REACTION_KINDS_MAX) return countsOf(target.reactions ?? {});
    next[reaction] = [...(next[reaction] ?? []), key];
  }
  target.reactions = next;
  return countsOf(next);
};

const countsOf = (reactions: Record<string, string[]>): Record<string, number> =>
  Object.fromEntries(Object.entries(reactions).map(([name, members]) => [name, members.length]));
