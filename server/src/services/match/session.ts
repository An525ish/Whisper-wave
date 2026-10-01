import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type { AnonSession, BufferedAnonMessage, VibeTag } from '../../types/match.js';
import { REDIS_KEYS, TTL } from './keys.js';

/** Create a new anon session in Redis. */
export const createSession = async (
  sessionId: string,
  anon1: string,
  anon2: string,
  name1: string,
  name2: string,
  tags1: VibeTag[],
  tags2: VibeTag[]
): Promise<AnonSession> => {
  const redis = getRedis();
  const session: AnonSession = {
    sessionId,
    anon1,
    anon2,
    name1,
    name2,
    tags1,
    tags2,
    status: 'active',
    createdAt: Date.now(),
  };

  // Pipeline: create session hash + empty likes set + set TTL on both.
  const pipe = redis.pipeline();
  pipe.set(REDIS_KEYS.session(sessionId), JSON.stringify(session), 'EX', TTL.session);
  pipe.set(REDIS_KEYS.activeSession(anon1), sessionId, 'EX', TTL.session);
  pipe.set(REDIS_KEYS.activeSession(anon2), sessionId, 'EX', TTL.session);
  pipe.del(REDIS_KEYS.likes(sessionId)); // clean slate
  pipe.expire(REDIS_KEYS.likes(sessionId), TTL.session);
  await pipe.exec();

  return session;
};

/** Get a session. Returns null if expired or never created. */
export const getSession = async (sessionId: string): Promise<AnonSession | null> => {
  const raw = await getRedis().get(REDIS_KEYS.session(sessionId));
  if (!raw) return null;
  return JSON.parse(raw) as AnonSession;
};

/** Resolve current match session for an anonId (null if not in an active match). */
export const getActiveSessionId = async (anonId: string): Promise<string | null> =>
  getRedis().get(REDIS_KEYS.activeSession(anonId));

/**
 * Extend an active session's TTL. Called on every message/typing event so a
 * long conversation never silently expires out from under the users.
 */
export const touchSession = async (sessionId: string): Promise<void> => {
  const redis = getRedis();
  const pipe = redis.pipeline();
  pipe.expire(REDIS_KEYS.session(sessionId), TTL.session);
  pipe.expire(REDIS_KEYS.messages(sessionId), TTL.session);
  try {
    await pipe.exec();
  } catch (err) {
    // Non-fatal: the session keeps working, it just stops being refreshed.
    logger.warn({ err, sessionId }, 'Failed to refresh session TTL');
  }
};

/**
 * Confirm that a given anonId is a participant of the session.
 * Used in every socket handler to prevent spoofing.
 */
export const isParticipant = (session: AnonSession, anonId: string): boolean =>
  session.anon1 === anonId || session.anon2 === anonId;

/** Get the partner's anonId for a participant. */
export const getPartner = (session: AnonSession, anonId: string): string =>
  session.anon1 === anonId ? session.anon2 : session.anon1;

/**
 * End a session — marks it as ending and clears the active-session pointers.
 *
 * The TTL is shortened to 1 hour rather than deleted: it keeps origin data
 * available for `connectToken` completion, but doesn't hold Redis memory for
 * 24 h after the session ends. Identity cards are deliberately LEFT in place so
 * either side can rejoin with the same alias after a reconnect or a skip.
 */
export const endSession = async (sessionId: string): Promise<void> => {
  const raw = await getRedis().get(REDIS_KEYS.session(sessionId));
  if (!raw) return;

  const session = JSON.parse(raw) as AnonSession;
  if (session.status === 'ending') return; // already torn down
  session.status = 'ending';

  const pipe = getRedis().pipeline();
  pipe.set(REDIS_KEYS.session(sessionId), JSON.stringify(session), 'EX', 60 * 60);
  pipe.expire(REDIS_KEYS.likes(sessionId), 60 * 60);
  pipe.del(REDIS_KEYS.activeSession(session.anon1));
  pipe.del(REDIS_KEYS.activeSession(session.anon2));
  pipe.del(REDIS_KEYS.presence(session.anon1));
  pipe.del(REDIS_KEYS.presence(session.anon2));
  await pipe.exec();
};

/** Hard-delete a session and associated data (after Connection is created). */
export const deleteSession = async (sessionId: string): Promise<void> => {
  const session = await getSession(sessionId);
  const pipe = getRedis().pipeline();
  pipe.del(REDIS_KEYS.session(sessionId));
  pipe.del(REDIS_KEYS.likes(sessionId));
  pipe.del(REDIS_KEYS.messages(sessionId));
  if (session) {
    pipe.del(REDIS_KEYS.activeSession(session.anon1));
    pipe.del(REDIS_KEYS.activeSession(session.anon2));
  }
  await pipe.exec();
};

/** Persist a message to the Redis buffer (last N messages for page refresh). */
export const bufferMessage = async (
  sessionId: string,
  message: BufferedAnonMessage
): Promise<void> => {
  const redis = getRedis();
  const pipe = redis.pipeline();
  pipe.lpush(REDIS_KEYS.messages(sessionId), JSON.stringify(message));
  pipe.ltrim(REDIS_KEYS.messages(sessionId), 0, TTL.maxMessages - 1);
  pipe.expire(REDIS_KEYS.messages(sessionId), TTL.session);
  await pipe.exec();
};

/** Retrieve buffered messages oldest-first (the order a reader expects). */
export const getBufferedMessages = async (
  sessionId: string
): Promise<BufferedAnonMessage[]> => {
  const raw = await getRedis().lrange(REDIS_KEYS.messages(sessionId), 0, -1);
  return raw
    .map((entry) => JSON.parse(entry) as BufferedAnonMessage)
    .reverse();
};
