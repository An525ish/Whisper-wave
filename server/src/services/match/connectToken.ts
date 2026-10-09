import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import type { ConnectTokenPayload, VerifiedConnectToken } from '../../types/match.js';
import { getSession } from './session.js';

/**
 * Issue a short-lived JWT that proves the holder was in a specific anon session
 * at the time of mutual like.
 *
 * Signed with ANON_JWT_SECRET (separate from ACCESS_TOKEN_SECRET) so a
 * compromised access token cannot be used to forge connection intent. Carries no
 * anonId — see `ConnectTokenPayload`. Each token gets a unique `jti` so a
 * consumer can make it single-use.
 */
export const issueConnectToken = (payload: ConnectTokenPayload): string => {
  const ttlMinutes = env.ANON_TOKEN_TTL_MIN;
  return jwt.sign(payload, env.ANON_JWT_SECRET, {
    expiresIn: `${ttlMinutes}m`,
    jwtid: uuid(),
  } as jwt.SignOptions);
};

/** Verify and decode a connectToken. Throws AppError on invalid/expired. */
export const verifyConnectToken = (token: string): VerifiedConnectToken => {
  try {
    const payload = jwt.verify(token, env.ANON_JWT_SECRET) as VerifiedConnectToken;
    if (!payload?.sessionId || (payload.side !== 0 && payload.side !== 1)) {
      throw new AppError(401, 'Invalid connect token');
    }
    return payload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Connect token expired or invalid — the moment may have passed');
  }
};

/**
 * Resolve the two anonIds behind a verified token, from the session in Redis.
 *
 * The token deliberately carries no ids, so this is the one place they are
 * recovered. The session record outlives the session itself by an hour (see
 * `endSession`), comfortably longer than `ANON_TOKEN_TTL_MIN`.
 */
export const resolveTokenAnonIds = async (
  payload: ConnectTokenPayload
): Promise<{ anonId: string; partnerAnonId: string }> => {
  const session = await getSession(payload.sessionId);
  if (!session) throw new AppError(410, 'That moment has passed — the whisper has expired');
  return payload.side === 0
    ? { anonId: session.anon1, partnerAnonId: session.anon2 }
    : { anonId: session.anon2, partnerAnonId: session.anon1 };
};
