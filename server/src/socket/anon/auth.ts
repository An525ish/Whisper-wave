import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import type { IncomingMessage } from 'http';
import type { ExtendedError } from 'socket.io';
import type { AnonSocket } from '../../types/anonSocket.js';
import { AppError } from '../../utils/AppError.js';
import {
  ACCESS_COOKIE,
  ANON_COOKIE,
  GID_COOKIE,
  parseAnonId,
  parseGid,
  verifiedUserId,
} from '../identity.js';

/** The parsed request shape cookie-parser produces. */
type CookieRequest = IncomingMessage & { cookies?: Record<string, string> };

/**
 * Socket.IO middleware for the /anon namespace.
 *
 * Parses the httpOnly `anonId` cookie and attaches it to the socket. The anonId
 * was already validated by `POST /api/match/join`, so there is no JWT or DB
 * lookup on the hot path.
 *
 * It also *optionally* reads the `accessToken` cookie, so a signed-in user has
 * an identity on the wire and not just in the app. This is a bonus link, never a
 * requirement: a guest has no `accessToken` and must reach a working anon session
 * regardless, so an absent, malformed, expired or unknown token all end the same
 * way — `socket.userId` stays undefined and the connection proceeds.
 *
 * Note what this does NOT do: it does not derive the anon alias from the
 * account. The alias is still chosen by the client, because the *other* party
 * would otherwise see someone's real account name inside an anonymous chat.
 * `userId` is carried for blocking, quota and cross-tab state only.
 *
 * Resume-only handshake (`auth: { resume: true }`): the cookie is still required
 * and validated exactly the same, but nothing else is — no identity card is needed,
 * because that connect never enqueues. See `handleAnonConnect`.
 */
export const applyAnonAuth = (
  socket: AnonSocket,
  next: (err?: ExtendedError) => void
): void => {
  cookieParser()(socket.request as Request, {} as Response, (err?: unknown) => {
    if (err) {
      next(err instanceof Error ? err : new Error('Cookie parse failed'));
      return;
    }

    const cookies = (socket.request as CookieRequest).cookies;
    // The cookie is client-controlled, so it is validated, not trusted: it ends up
    // in Redis keys, room names and `anonId:reaction` set members. Anything that is
    // not a UUID is rejected exactly like a missing cookie.
    const anonId = parseAnonId(cookies?.[ANON_COOKIE]);

    if (!anonId) {
      next(
        new AppError(
          401,
          'Anonymous session not found. Call POST /api/match/join first.'
        ) as ExtendedError
      );
      return;
    }

    socket.anonId = anonId;
    // Stable guest id for abuse control (bans, rate limits). Optional here —
    // the /rooms and /play namespaces require it; /anon only carries it.
    socket.gid = parseGid(cookies?.[GID_COOKIE]);
    // Strict `true`: a client-controlled value, and anything else is a normal join.
    socket.resumeOnly = isResumeHandshake(socket.handshake?.auth);
    socket.userId = verifiedUserId(cookies?.[ACCESS_COOKIE]);
    next();
  });
};

/** `auth: { resume: true }` on the Socket.IO handshake — resume-only connect. */
export const isResumeHandshake = (auth: unknown): boolean =>
  typeof auth === 'object' && auth !== null && (auth as { resume?: unknown }).resume === true;
