import { getRedis } from '../../config/redis.js';
import { META_FIELDS, REDIS_KEYS, TTL } from './keys.js';
import { getSession } from './session.js';
import { issueConnectToken } from './connectToken.js';
import { AppError } from '../../utils/AppError.js';
import type { ConnectTokenPayload, LikeResult } from '../../types/match.js';

/**
 * Mutual-like token pairs a single session may mint. A re-like after the mutual
 * is idempotent for the match itself, but every call would otherwise sign two
 * fresh tokens; this caps that (the like limiter caps the rate).
 */
const MAX_TOKEN_ISSUES = 4;

/**
 * Record a like for anonId in sessionId.
 * Returns 'one_sided' or 'mutual'.
 *
 * Atomic: SADD + SCARD are pipelined, so there is no TOCTOU window between
 * "did I like?" and "how many liked?".
 */
export const recordLike = async (
  sessionId: string,
  anonId: string
): Promise<LikeResult> => {
  const redis = getRedis();

  // Verify session exists and anonId is an active participant.
  const session = await getSession(sessionId);
  if (!session) throw new AppError(404, 'Session not found or expired');
  if (session.anon1 !== anonId && session.anon2 !== anonId) {
    throw new AppError(403, 'Not a participant of this session');
  }
  if (session.status !== 'active') {
    throw new AppError(409, 'Session is no longer active');
  }

  // The EXPIRE is what bounds the likes set: without it a session that never
  // ends cleanly would leave the key behind forever.
  const pipe = redis.pipeline();
  pipe.sadd(REDIS_KEYS.likes(sessionId), anonId);
  pipe.expire(REDIS_KEYS.likes(sessionId), TTL.session);
  pipe.scard(REDIS_KEYS.likes(sessionId));
  const results = await pipe.exec();
  const likeCount = (results?.[2]?.[1] ?? 0) as number;

  if (likeCount < 2) return { type: 'one_sided' };

  const tokenPipe = redis.pipeline();
  tokenPipe.hincrby(REDIS_KEYS.meta(sessionId), META_FIELDS.tokens, 1);
  tokenPipe.expire(REDIS_KEYS.meta(sessionId), TTL.session);
  const issued = Number((await tokenPipe.exec())?.[0]?.[1] ?? 0);
  if (issued > MAX_TOKEN_ISSUES) {
    throw new AppError(429, 'Already vibing — head to your connections to continue.');
  }

  // Mutual like — build a payload per perspective and issue a token for each,
  // so both sides can prove they were in this session at the moment of the like.
  const myIndex: 0 | 1 = session.anon1 === anonId ? 0 : 1;
  const partnerIndex: 0 | 1 = myIndex === 0 ? 1 : 0;

  const names = [session.name1, session.name2];
  const tags = [session.tags1, session.tags2];

  // No anonIds in a token: it is handed to the client and a JWT payload is
  // readable. `side` is the holder's seat; the server resolves ids from the session.
  const payloadA: ConnectTokenPayload = {
    sessionId,
    side: myIndex,
    displayName: names[myIndex],
    partnerName: names[partnerIndex],
    vibeTags: tags[myIndex],
    partnerTags: tags[partnerIndex],
  };

  const payloadB: ConnectTokenPayload = {
    sessionId,
    side: partnerIndex,
    displayName: names[partnerIndex],
    partnerName: names[myIndex],
    vibeTags: tags[partnerIndex],
    partnerTags: tags[myIndex],
  };

  return {
    type: 'mutual',
    tokenA: issueConnectToken(payloadA),
    tokenB: issueConnectToken(payloadB),
  };
};
