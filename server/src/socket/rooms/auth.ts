import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import type { IncomingMessage } from 'http';
import type { ExtendedError } from 'socket.io';
import type { RoomSocket } from '../../types/room.js';
import { AppError } from '../../utils/AppError.js';
import {
  ACCESS_COOKIE,
  ANON_COOKIE,
  parseAnonId,
  parseGid,
  verifiedUserId,
} from '../identity.js';

/** The parsed request shape cookie-parser produces. */
type CookieRequest = IncomingMessage & { cookies?: Record<string, string> };

/**
 * Socket.IO middleware for the `/rooms` namespace.
 *
 * `gid` is REQUIRED here (unlike `/anon`, which only carries it): bans,
 * rate limits and mutes all key on the stable guest id, and a rooms socket
 * without one is unaccountable. Guests get it from `ensureGid` on any prior
 * HTTP call; `accessToken` stays optional, exactly like `/anon`.
 */
export const applyRoomAuth = (
  socket: RoomSocket,
  next: (err?: ExtendedError) => void
): void => {
  cookieParser()(socket.request as Request, {} as Response, (err?: unknown) => {
    if (err) {
      next(err instanceof Error ? err : new Error('Cookie parse failed'));
      return;
    }

    const cookies = (socket.request as CookieRequest).cookies;
    const gid = parseGid(cookies?.['gid']);
    if (!gid) {
      next(
        new AppError(
          401,
          'Room identity required — open the app once, then rejoin.'
        ) as ExtendedError
      );
      return;
    }

    socket.gid = gid;
    socket.userId = verifiedUserId(cookies?.[ACCESS_COOKIE]);
    socket.anonId = parseAnonId(cookies?.[ANON_COOKIE]);
    next();
  });
};
