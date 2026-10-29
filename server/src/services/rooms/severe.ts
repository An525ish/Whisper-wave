import { logger } from '../../utils/logger.js';
import { appendMessage, onInstanceClosed } from './registry.js';
import { fileAutoRoomReport } from './reports.js';
import type { LiveRoomMember } from '../../types/room.js';

/** One auto-report per (instance, sender, category) per hour — a spammer cannot flood the queue. */
const DEDUPE_MS = 60 * 60 * 1000;
const MAX_TRACKED = 2_000;

const seen = new Map<string, Map<string, number>>();

onInstanceClosed((instanceId) => {
  seen.delete(instanceId);
});

const tracked = (): number => {
  let n = 0;
  for (const inner of seen.values()) n += inner.size;
  return n;
};

/** Claim the (sender, category) slot; false when already reported recently (or the map is saturated). */
const claim = (instanceId: string, senderKey: string, category: string, now: number): boolean => {
  const inner = seen.get(instanceId) ?? new Map<string, number>();
  const key = `${senderKey}|${category}`;
  const last = inner.get(key);
  if (last !== undefined && now - last < DEDUPE_MS) return false;
  if (last === undefined && tracked() >= MAX_TRACKED) {
    for (const [id, map] of seen) {
      for (const [k, at] of map) if (now - at >= DEDUPE_MS) map.delete(k);
      if (map.size === 0) seen.delete(id);
    }
    if (tracked() >= MAX_TRACKED) return false;
  }
  inner.set(key, now);
  seen.set(instanceId, inner);
  return true;
};

/**
 * A severe automod hit never posts, but it must leave evidence: park the text
 * in the ring as a HIDDEN message (never shown to anyone, mods see it flagged),
 * then file a system report whose snapshot is built from the raw ring.
 * Fire-and-forget — the sender's ack must not wait on Mongo.
 */
export const reportSevereHit = (params: {
  instanceId: string;
  slug: string;
  member: LiveRoomMember;
  senderGid: string;
  text: string;
  category: string;
  now?: number;
}): void => {
  const { instanceId, slug, member, senderGid, text, category, now = Date.now() } = params;
  if (!claim(instanceId, member.key, category, now)) return;
  const message = appendMessage(instanceId, {
    alias: member.alias,
    color: member.color,
    role: member.role,
    text,
    senderGid,
    ...(member.userId ? { senderUserId: member.userId } : {}),
    hidden: true,
    ts: now,
  });
  if (!message) return;
  void fileAutoRoomReport({ instanceId, slug, messageId: message.id, category }).catch((err: unknown) =>
    logger.error({ err, instanceId, category }, 'Auto room report failed')
  );
};
