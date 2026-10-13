import type { ChainableCommander } from 'ioredis';
import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type {
  AnonSession,
  CreateSessionInput,
  SessionMessageCounts,
  StoredAnonMessage,
} from '../../types/match.js';
import { META_FIELDS, REDIS_KEYS, TTL } from './keys.js';

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

  // One pipeline: the session, both active-session pointers, the
  // anonId → userId aliases (so a later block can be mirrored onto the account)
  // and the per-account session index.
  const pipe = redis.pipeline();
  pipe.set(REDIS_KEYS.session(sessionId), JSON.stringify(session), 'EX', TTL.session);
  pipe.set(REDIS_KEYS.activeSession(anon1), sessionId, 'EX', TTL.session);
  pipe.set(REDIS_KEYS.activeSession(anon2), sessionId, 'EX', TTL.session);
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
 * Confirm that a given anonId is a participant of the session.
 * Used in every socket handler to prevent spoofing.
 */
export const isParticipant = (session: AnonSession, anonId: string): boolean =>
  session.anon1 === anonId || session.anon2 === anonId;

/** Get the partner's anonId for a participant. */
export const getPartner = (session: AnonSession, anonId: string): string =>
  session.anon1 === anonId ? session.anon2 : session.anon1;

/** Message ids currently in the buffer — the only way to find their reaction keys. */
const bufferedMessageIds = async (sessionId: string): Promise<string[]> => {
  const raw = await getRedis().lrange(REDIS_KEYS.messages(sessionId), 0, -1);
  const ids: string[] = [];
  for (const entry of raw) {
    try {
      const id = (JSON.parse(entry) as StoredAnonMessage).id;
      if (id) ids.push(id);
    } catch (err) {
      // An unreadable row has no id we could clean up; the reaction key (if any)
      // falls back to its own TTL. Logged because the buffer should never hold one.
      logger.warn({ err, sessionId }, 'Unparseable anon message while clearing a session');
    }
  }
  return ids;
};

/**
 * Queue the deletion of everything that holds a conversation's CONTENT: the
 * message buffer, its reactions and the per-side counters. "Transcripts die with
 * the session" is a product promise, so this runs on every way a session ends.
 *
 * Reactions hang off individual messages, so they are found by walking the
 * buffer. A reaction on a message that already fell out of the last-50 buffer
 * cannot be found and expires on its own `TTL.reactions` — it holds an anonId and
 * an emoji key, never text.
 */
const queueContentDeletion = (
  pipe: ChainableCommander,
  sessionId: string,
  messageIds: string[]
): void => {
  pipe.del(REDIS_KEYS.messages(sessionId));
  pipe.del(REDIS_KEYS.meta(sessionId));
  pipe.del(REDIS_KEYS.likes(sessionId));
  for (const id of messageIds) pipe.del(REDIS_KEYS.reactions(sessionId, id));
};

/**
 * End a session — marks it as ending, clears the active-session pointers and
 * DELETES the chat content (messages, reactions, counters).
 *
 * The session record itself is kept for 1 hour rather than deleted: it holds only
 * aliases/tags/ids and is what `connectToken` completion resolves the two anonIds
 * from. Completion never needs the buffered messages — anon messages are not
 * carried into the connected layer. Identity cards are deliberately LEFT in place
 * so either side can rejoin with the same alias after a reconnect or a skip.
 */
export const endSession = async (sessionId: string): Promise<void> => {
  const raw = await getRedis().get(REDIS_KEYS.session(sessionId));
  if (!raw) return;

  const session = JSON.parse(raw) as AnonSession;
  if (session.status === 'ending') return; // already torn down
  session.status = 'ending';

  const messageIds = await bufferedMessageIds(sessionId);

  const pipe = getRedis().pipeline();
  pipe.set(REDIS_KEYS.session(sessionId), JSON.stringify(session), 'EX', 60 * 60);
  queueContentDeletion(pipe, sessionId, messageIds);
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
  const messageIds = await bufferedMessageIds(sessionId);
  const pipe = getRedis().pipeline();
  pipe.del(REDIS_KEYS.session(sessionId));
  queueContentDeletion(pipe, sessionId, messageIds);
  if (session) {
    pipe.del(REDIS_KEYS.activeSession(session.anon1));
    pipe.del(REDIS_KEYS.activeSession(session.anon2));
    for (const userId of [session.userId1, session.userId2]) {
      if (userId) pipe.srem(REDIS_KEYS.userSessions(userId), sessionId);
    }
  }
  await pipe.exec();
};

/**
 * Accept one message into the session, atomically and in ONE command:
 *
 *   - reject a duplicate client id (returns 0) — a stored entry starts with
 *     `{"id":<json id>,` because `id` is serialised first, so the check is an
 *     exact prefix compare and message content can never spoof it;
 *   - LPUSH + LTRIM to the last-N buffer, bump this side's counter (the vibe gate
 *     reads counters, not the buffer — the buffer forgets), and refresh the TTL of
 *     the buffer, counters, session and the sender's identity card.
 *
 * Folding all of that into one script is what keeps a message at one Redis
 * command here instead of six (Upstash bills per command).
 */
const RECORD_MESSAGE_SCRIPT = `
  local prefix = ARGV[1]
  if prefix ~= '' then
    local entries = redis.call('LRANGE', KEYS[1], 0, -1)
    for i = 1, #entries do
      if string.sub(entries[i], 1, #prefix) == prefix then
        return 0
      end
    end
  end
  redis.call('LPUSH', KEYS[1], ARGV[2])
  redis.call('LTRIM', KEYS[1], 0, tonumber(ARGV[3]) - 1)
  redis.call('HINCRBY', KEYS[2], ARGV[5], 1)
  redis.call('EXPIRE', KEYS[1], ARGV[4])
  redis.call('EXPIRE', KEYS[2], ARGV[4])
  redis.call('EXPIRE', KEYS[3], ARGV[4])
  redis.call('EXPIRE', KEYS[4], ARGV[4])
  return 1
`;

/**
 * Persist a message to the Redis buffer (last N, for page refresh) and count it.
 * Returns false when `message.id` was already used in this session.
 */
export const recordMessage = async (
  session: AnonSession,
  message: StoredAnonMessage
): Promise<boolean> => {
  const { sessionId } = session;
  const field = session.anon1 === message.from ? META_FIELDS.count1 : META_FIELDS.count2;
  // `id` first — the duplicate check in the script depends on this key order.
  const stored = JSON.stringify({
    ...(message.id ? { id: message.id } : {}),
    from: message.from,
    content: message.content,
    sentAt: message.sentAt,
  });
  const idPrefix = message.id ? `{"id":${JSON.stringify(message.id)},` : '';

  const accepted = await getRedis().eval(
    RECORD_MESSAGE_SCRIPT,
    4,
    REDIS_KEYS.messages(sessionId),
    REDIS_KEYS.meta(sessionId),
    REDIS_KEYS.session(sessionId),
    REDIS_KEYS.waiting(message.from),
    idPrefix,
    stored,
    String(TTL.maxMessages),
    String(TTL.session),
    field
  );
  return Number(accepted) === 1;
};

/** Messages accepted from each side so far (the vibe gate's input). */
export const getMessageCounts = async (sessionId: string): Promise<SessionMessageCounts> => {
  const [a, b] = await getRedis().hmget(
    REDIS_KEYS.meta(sessionId),
    META_FIELDS.count1,
    META_FIELDS.count2
  );
  return { countA: Number(a ?? 0), countB: Number(b ?? 0) };
};

/** Retrieve buffered messages oldest-first (the order a reader expects). */
export const getBufferedMessages = async (
  sessionId: string
): Promise<StoredAnonMessage[]> => {
  const raw = await getRedis().lrange(REDIS_KEYS.messages(sessionId), 0, -1);
  return raw
    .map((entry) => JSON.parse(entry) as StoredAnonMessage)
    .reverse();
};
