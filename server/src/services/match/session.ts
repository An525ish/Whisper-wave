import type { ChainableCommander } from 'ioredis';
import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type { AnonSession, BufferedAnonMessage, CreateSessionInput } from '../../types/match.js';
import { REDIS_KEYS, TTL } from './keys.js';

/**
 * Create a new anon session in Redis.
 *
 * Takes a bag rather than nine positional parameters because the two optional
 * `userId`s would otherwise be easy to transpose — and transposing them writes
 * a wrong account onto a stranger's side of a chat.
 */
export const createSession = async (input: CreateSessionInput): Promise<AnonSession> => {
  const {
    sessionId,
    anon1,
    anon2,
    name1,
    name2,
    tags1,
    tags2,
    userId1,
    userId2,
  } = input;

  const redis = getRedis();
  const session: AnonSession = {
    sessionId,
    anon1,
    anon2,
    name1,
    name2,
    tags1,
    tags2,
    ...(userId1 ? { userId1 } : {}),
    ...(userId2 ? { userId2 } : {}),
    status: 'active',
    createdAt: Date.now(),
  };

  // One pipeline: the session, its likes set, both active-session pointers, the
  // anonId → userId aliases (so a later block can be mirrored onto the account)
  // and the per-account session index.
  const pipe = redis.pipeline();
  pipe.set(REDIS_KEYS.session(sessionId), JSON.stringify(session), 'EX', TTL.session);
  pipe.set(REDIS_KEYS.activeSession(anon1), sessionId, 'EX', TTL.session);
  pipe.set(REDIS_KEYS.activeSession(anon2), sessionId, 'EX', TTL.session);
  pipe.del(REDIS_KEYS.likes(sessionId)); // clean slate
  pipe.expire(REDIS_KEYS.likes(sessionId), TTL.session);
  writeIdentityLinks(pipe, sessionId, [
    { anonId: anon1, userId: userId1 },
    { anonId: anon2, userId: userId2 },
  ]);
  await pipe.exec();

  return session;
};

/** Record `userId → sessionId` for each signed-in side, and `anonId → userId`. */
const writeIdentityLinks = (
  pipe: ChainableCommander,
  sessionId: string,
  sides: { anonId: string; userId?: string }[]
): void => {
  for (const { anonId, userId } of sides) {
    if (!userId) continue;
    pipe.set(REDIS_KEYS.identityAlias(anonId), userId, 'EX', TTL.identityAlias);
    pipe.sadd(REDIS_KEYS.userSessions(userId), sessionId);
    pipe.expire(REDIS_KEYS.userSessions(userId), TTL.session);
  }
};

/**
 * Is this account already in an anonymous match under some OTHER anonId?
 *
 * `match:active:{anonId}` can only see one identity, so a signed-in user on a
 * phone and a laptop — two anonIds, one account — is invisible to it, and the
 * account can be matched into two simultaneous threads. That is the concurrent
 * anonymous chats problem the docs reject, one level up.
 *
 * Sessions this anonId already holds are NOT a conflict — that is the normal
 * cross-tab case, resumed by the caller before this runs. Only a session this
 * socket is not part of counts, and only one that is still genuinely active.
 * Entries whose session is gone or already ending are dropped, so a process that
 * died mid-session cannot lock the account out for the full TTL.
 */
export const getUserActiveSessions = async (
  userId: string,
  anonId: string
): Promise<AnonSession[]> => {
  const ids = await getRedis().smembers(REDIS_KEYS.userSessions(userId));
  const live: AnonSession[] = [];

  for (const sessionId of ids) {
    if (!sessionId) continue;
    const session = await getSession(sessionId);
    if (!session || session.status !== 'active') continue;
    if (isParticipant(session, anonId)) continue; // ours — already handled
    live.push(session);
  }
  return live;
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
  // The account index must not keep pointing at a match that is over, or the
  // account would read as "already in a whisper" forever.
  for (const userId of [session.userId1, session.userId2]) {
    if (userId) pipe.srem(REDIS_KEYS.userSessions(userId), sessionId);
  }
  await pipe.exec();
};

/** Hard-delete a session and associated data (after Connection is created). */
export const deleteSession = async (sessionId: string): Promise<void> => {
  const session = await getSession(sessionId);
  const messages = await getBufferedMessages(sessionId);
  const pipe = getRedis().pipeline();
  pipe.del(REDIS_KEYS.session(sessionId));
  pipe.del(REDIS_KEYS.likes(sessionId));
  pipe.del(REDIS_KEYS.messages(sessionId));
  // Reactions hang off individual messages, so they can only be found by
  // walking the buffer we are about to drop. Without this they would sit in
  // Redis until their TTL, holding a private conversation's contents.
  for (const message of messages) {
    if (message.id) pipe.del(REDIS_KEYS.reactions(sessionId, message.id));
  }
  if (session) {
    pipe.del(REDIS_KEYS.activeSession(session.anon1));
    pipe.del(REDIS_KEYS.activeSession(session.anon2));
    for (const userId of [session.userId1, session.userId2]) {
      if (userId) pipe.srem(REDIS_KEYS.userSessions(userId), sessionId);
    }
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
