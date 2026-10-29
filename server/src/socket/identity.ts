import type { Identity } from '../types/identity.js';
import { logger } from '../utils/logger.js';
import { verifyToken } from '../utils/token.js';
import { anonIdSchema, gidSchema } from '../validators/anon.js';

/** Cookie names carrying identity. `gid` and `anonId` are separate namespaces. */
export const GID_COOKIE = 'gid';
export const ANON_COOKIE = 'anonId';
export const ACCESS_COOKIE = 'accessToken';

/** A validated stable guest id, or undefined when absent or forged. */
export const parseGid = (value: unknown): string | undefined => {
  const parsed = gidSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

/** A validated anonymous session id, or undefined when absent or forged. */
export const parseAnonId = (value: unknown): string | undefined => {
  const parsed = anonIdSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

/**
 * The account id behind an access token, or undefined.
 *
 * Never throws: an invalid token is the normal case for a guest and for a
 * signed-in user whose 15-minute access cookie has simply expired, and neither
 * may be locked out by it. The refresh flow is the HTTP client's job.
 *
 * Logs a warning without the token, so a signing-key problem is still visible.
 */
export const verifiedUserId = (token: string | undefined): string | undefined => {
  if (!token) return undefined;
  try {
    return verifyToken(token).id;
  } catch (err) {
    logger.debug({ err }, 'Presented an unusable accessToken — staying anonymous');
    return undefined;
  }
};

export type RawIdentityCookies = {
  gid?: string;
  anonId?: string;
  accessToken?: string;
};

/**
 * Resolve cookies to one identity shape.
 *
 * Returns null when there is nothing usable at all (fresh browser, no
 * cookies) — the HTTP `ensureGid` middleware mints a gid first, so it never
 * sees null; socket layers treat null as unauthenticated. A forged gid or
 * anonId is treated exactly like an absent one: both end up in keys and room
 * names downstream, so anything that is not a UUID is rejected.
 */
export const resolveIdentity = (
  cookies: RawIdentityCookies | undefined
): Identity | null => {
  const gid = parseGid(cookies?.[GID_COOKIE]);
  const anonId = parseAnonId(cookies?.[ANON_COOKIE]);
  const userId = verifiedUserId(cookies?.[ACCESS_COOKIE]);

  if (userId) {
    return {
      kind: 'member',
      userId,
      ...(gid ? { gid } : {}),
      ...(anonId ? { anonId } : {}),
    };
  }
  if (gid) {
    return { kind: 'guest', gid, ...(anonId ? { anonId } : {}) };
  }
  return null;
};
