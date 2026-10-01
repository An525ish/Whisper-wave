import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import type { IncomingMessage } from 'http';
import type { ExtendedError } from 'socket.io';
import type { AnonSocket } from './types.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { verifyToken } from '../../utils/token.js';

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
    const anonId = cookies?.['anonId'];

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
    socket.userId = verifiedUserId(cookies?.['accessToken']);
    next();
  });
};

/**
 * The account id behind an access token, or undefined.
 *
 * Never throws: an invalid token is the normal case for a guest and for a
 * signed-in user whose 15-minute access cookie has simply expired, and neither
 * may be locked out of Whisper by it. The refresh flow is the HTTP client's job.
 *
 * Logs a warning without the token, so a signing-key problem is still visible.
 */
const verifiedUserId = (token: string | undefined): string | undefined => {
  if (!token) return undefined;
  try {
    return verifyToken(token).id;
  } catch (err) {
    logger.debug({ err }, 'Anon socket presented an unusable accessToken — staying anonymous');
    return undefined;
  }
};
