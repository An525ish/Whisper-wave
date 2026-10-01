import { getRedis } from '../../config/redis.js';
import { REDIS_KEYS } from './keys.js';
import { getSession, getPartner } from './session.js';
import { issueConnectToken } from './connectToken.js';
import { AppError } from '../../utils/AppError.js';
import type { ConnectTokenPayload, LikeResult } from '../../types/match.js';

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

  const pipe = redis.pipeline();
  pipe.sadd(REDIS_KEYS.likes(sessionId), anonId);
  pipe.scard(REDIS_KEYS.likes(sessionId));
  const results = await pipe.exec();
  const likeCount = (results?.[1]?.[1] ?? 0) as number;

  if (likeCount < 2) return { type: 'one_sided' };

  // Mutual like — build a payload per perspective and issue a token for each,
  // so both sides can prove they were in this session at the moment of the like.
  const partnerAnonId = getPartner(session, anonId);
  const myIndex = session.anon1 === anonId ? 0 : 1;
  const partnerIndex = 1 - myIndex;

  const names = [session.name1, session.name2];
  const tags = [session.tags1, session.tags2];

  const payloadA: ConnectTokenPayload = {
    sessionId,
    anonId,
    partnerAnonId,
    displayName: names[myIndex],
    partnerName: names[partnerIndex],
    vibeTags: tags[myIndex],
    partnerTags: tags[partnerIndex],
  };

  const payloadB: ConnectTokenPayload = {
    sessionId,
    anonId: partnerAnonId,
    partnerAnonId: anonId,
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
