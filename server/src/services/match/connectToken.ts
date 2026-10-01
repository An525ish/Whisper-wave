import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import type { ConnectTokenPayload } from '../../types/match.js';

/**
 * Issue a short-lived JWT that proves the holder was in a specific anon session
 * at the time of mutual like.
 *
 * Signed with ANON_JWT_SECRET (separate from ACCESS_TOKEN_SECRET) so a
 * compromised access token cannot be used to forge connection intent.
 */
export const issueConnectToken = (payload: ConnectTokenPayload): string => {
  const ttlMinutes = env.ANON_TOKEN_TTL_MIN;
  return jwt.sign(payload, env.ANON_JWT_SECRET, {
    expiresIn: `${ttlMinutes}m`,
  } as jwt.SignOptions);
};

/** Verify and decode a connectToken. Throws AppError on invalid/expired. */
export const verifyConnectToken = (token: string): ConnectTokenPayload => {
  try {
    const payload = jwt.verify(token, env.ANON_JWT_SECRET) as ConnectTokenPayload;
    if (!payload?.sessionId || !payload?.anonId) {
      throw new AppError(401, 'Invalid connect token');
    }
    return payload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Connect token expired or invalid — the moment may have passed');
  }
};
