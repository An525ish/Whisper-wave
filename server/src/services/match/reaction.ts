import { getRedis } from '../../config/redis.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { ANON_REACTIONS } from '../../types/match.js';
import type {
  AnonMessageReactions,
  AnonReaction,
  AnonReactionAction,
  AnonSessionReactions,
  BufferedAnonMessage,
} from '../../types/match.js';
import { REDIS_KEYS, TTL } from './keys.js';
import { requireActiveParticipant } from './pairing.js';
import { getPartner } from './session.js';

/**
 * Vibe reactions on individual anon messages.
 *
 * Redis, never Mongo. Anon messages are deliberately not persisted — that is a
 * privacy promise in PRODUCT.md, not an implementation detail — so reactions
 * live in exactly the same place the messages do and expire with them.
 *
 * One SET per message, members are `anonId:reaction`. That shape gives us three
 * things for free: a per-person reaction is a single SREM to change or drop, a
 * client can never react twice to the same message with two different reactions
 * (the member is keyed on both), and the set is bounded by the curated size.
 *
 * Lives beside the other `match` services rather than in `socket/` so the
 * business rules (curated set, one reaction per person, message must exist) are
 * testable without a socket.
 */

/** Redis member = `<anonId>:<reaction>`, so one SREM both replaces and drops. */
const member = (anonId: string, reaction: AnonReaction): string => `${anonId}:${reaction}`;

/**
 * Group raw `anonId:reaction` members by who left them.
 *
 * An unreadable member is dropped rather than surfaced: the only way to get one is
 * a future format change, and inventing a reaction value for it would be worse
 * than omitting it.
 */
const groupMembers = (raw: string[]): AnonMessageReactions => {
  const grouped: AnonMessageReactions = {};
  for (const entry of raw) {
    const sep = entry.indexOf(':');
    if (sep <= 0) continue;
    const reaction = entry.slice(sep + 1);
    if (!(ANON_REACTIONS as readonly string[]).includes(reaction)) continue;
    (grouped[entry.slice(0, sep)] ??= []).push(reaction as AnonReaction);
  }
  return grouped;
};

/** The reactions on one message, grouped by the anonId that left them. */
export const getMessageReactions = async (
  sessionId: string,
  messageId: string
): Promise<AnonMessageReactions> => {
  const members = await getRedis().smembers(REDIS_KEYS.reactions(sessionId, messageId));
  return groupMembers(members);
};

/** Reactions on every buffered message, for replaying a thread on reconnect. */
export const getSessionReactions = async (
  sessionId: string,
  messages: BufferedAnonMessage[]
): Promise<AnonSessionReactions> => {
  const byMessage: AnonSessionReactions = {};
  const withIds = messages.filter((m): m is BufferedAnonMessage & { id: string } => Boolean(m.id));
  if (withIds.length === 0) return byMessage;

  // One round-trip for the whole thread, not one per message.
  const pipe = getRedis().pipeline();
  for (const message of withIds) {
    pipe.smembers(REDIS_KEYS.reactions(sessionId, message.id));
  }
  const results = await pipe.exec();

  for (const [index, message] of withIds.entries()) {
    const entry = results?.[index];
    if (!entry || entry[0]) continue; // a failed read omits, it does not invent
    const grouped = groupMembers((entry[1] as string[]) ?? []);
    if (Object.keys(grouped).length > 0) byMessage[message.id] = grouped;
  }
  return byMessage;
};

/**
 * The `ANON_REACT` payload schema lives in `validators/anon.ts` with the other
 * socket-payload schemas — validators belong at the boundary, not inside a
 * service.
 */
export { anonReactionSchema } from '../../validators/anon.js';

export type ApplyReactionResult = {
  messageId: string;
  reaction: AnonReaction;
  /** Who reacted — the client maps this to "me" or "them". */
  anonId: string;
  /** The other participant's anonId, so the caller can broadcast to them. */
  partnerAnonId: string;
  action: AnonReactionAction;
};

/**
 * Add or remove one person's reaction to one message.
 *
 * Toggle semantics: sending the reaction they already have removes it, sending
 * a different one replaces it. A person holds at most one reaction per message,
 * which is what keeps a set from becoming a log.
 *
 * Throws `AppError` when the session is dead or the message is not in the
 * buffer — the two cases the client must be able to tell apart, which is why
 * they are distinct codes rather than one generic failure.
 */
export const applyAnonReaction = async (
  sessionId: string | undefined,
  anonId: string,
  messageId: string,
  reaction: AnonReaction
): Promise<ApplyReactionResult> => {
  const session = await requireActiveParticipant(sessionId, anonId);

  if (!(await hasMessage(session.sessionId, messageId))) {
    throw new AppError(404, 'That message is not in this chat any more');
  }

  const key = REDIS_KEYS.reactions(session.sessionId, messageId);
  const wanted = member(anonId, reaction);
  const existing = await getRedis().smembers(key);
  const alreadyReacted = existing.includes(wanted);

  // Replace-then-add in one round-trip: SREM clears this person's other
  // reactions on the message, and SADDs the new one unless it is a toggle-off.
  const pipe = getRedis().pipeline();
  pipe.srem(key, ...existing.filter((m) => m.startsWith(`${anonId}:`)));
  if (!alreadyReacted) pipe.sadd(key, wanted);
  pipe.expire(key, TTL.reactions);
  await pipe.exec();

  return {
    messageId,
    reaction,
    anonId,
    partnerAnonId: getPartner(session, anonId),
    action: alreadyReacted ? 'removed' : 'added',
  };
};

/**
 * Is this message in the session's buffer?
 *
 * Scans the buffer rather than keeping a parallel id index: the buffer is capped
 * at `TTL.maxMessages`, so this is bounded, and it cannot drift out of sync with
 * the messages the client actually saw — which a separate index can, silently
 * accepting a reaction on a message the partner will never see.
 *
 * Reacting to a message that is not there is refused rather than ignored,
 * because accepting it would let anyone mint reaction keys for ids that never
 * existed.
 */
const hasMessage = async (sessionId: string, messageId: string): Promise<boolean> => {
  const raw = await getRedis().lrange(REDIS_KEYS.messages(sessionId), 0, -1);
  return raw.some((entry) => {
    const parsed = parseBufferedMessage(entry);
    return parsed?.id === messageId;
  });
};

/** Parse one buffer entry, tolerating a legacy or truncated row. */
const parseBufferedMessage = (raw: string): BufferedAnonMessage | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as BufferedAnonMessage;
  } catch (err) {
    // A row we cannot parse is not a message, so the reaction is refused. Logged
    // because an unparseable buffer means something is wrong upstream.
    logger.warn({ err }, 'Unparseable anon message in buffer');
    return null;
  }
};
