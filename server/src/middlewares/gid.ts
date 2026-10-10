import { v4 as uuid } from 'uuid';
import type { NextFunction, Request, Response } from 'express';
import { gidCookieOptions } from '../config/cors.js';
import {
  ANON_COOKIE,
  GID_COOKIE,
  parseAnonId,
  parseGid,
  resolveIdentity,
} from '../socket/identity.js';

/**
 * Guarantee every API caller has a stable guest id.
 *
 * A valid `gid` cookie passes through untouched. A missing or forged one is
 * replaced with a fresh UUID and a `Set-Cookie` — forgery is handled the same
 * as absence, because the gid ends up in ban keys downstream and anything that
 * is not a UUID must never get there. Never errors; identification is not
 * authentication.
 *
 * Also attaches `req.identity` (guest or member) so routes read one shape
 * instead of three cookies.
 */
export const ensureGid = (req: Request, res: Response, next: NextFunction): void => {
  const cookies = req.cookies as
    | { gid?: string; anonId?: string; accessToken?: string }
    | undefined;

  const gid = parseGid(cookies?.[GID_COOKIE]);
  if (gid) {
    // Null is impossible here — the resolver only returns it when the gid is
    // absent, and we just validated one. The fallback keeps the type total.
    req.identity = resolveIdentity(cookies) ?? { kind: 'guest', gid };
    next();
    return;
  }

  const fresh = uuid();
  res.cookie(GID_COOKIE, fresh, gidCookieOptions);
  const anonId = parseAnonId(cookies?.[ANON_COOKIE]);
  req.identity = { kind: 'guest', gid: fresh, ...(anonId ? { anonId } : {}) };
  next();
};
