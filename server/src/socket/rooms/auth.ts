import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import type { IncomingMessage } from 'http';
import type { ExtendedError } from 'socket.io';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import { isFeatureEnabled } from '../../services/hub.js';
import { assertNotGloballyBanned } from '../../services/rooms/access.js';
import { logger } from '../../utils/logger.js';
import type { RoomAckCode, RoomSocket } from '../../types/room.js';
import {
  ACCESS_COOKIE,
  ANON_COOKIE,
  parseAnonId,
  parseGid,
  verifiedUserId,
} from '../identity.js';
import { ackCodeOf } from './wire.js';

/** The parsed request shape cookie-parser produces. */
type CookieRequest = IncomingMessage & { cookies?: Record<string, string> };

/** A handshake refusal the client can branch on: `err.data.code` is a `RoomAckCode`. */
const refuse = (code: RoomAckCode, message: string): ExtendedError => {
  const err: ExtendedError = new Error(message);
  err.data = { code };
  return err;
};

/**
 * Socket.IO middleware for the `/rooms` namespace.
 *
 * Refuses outright when the rooms flag is off, or when the identity carries a
 * global room ban (room-scoped bans still bite at join).
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
  if (!isFeatureEnabled('rooms')) {
    next(refuse(ROOM_ERROR_CODES.FEATURE_OFF, 'Rooms are switched off right now.'));
    return;
  }

  cookieParser()(socket.request as Request, {} as Response, (err?: unknown) => {
    if (err) {
      next(err instanceof Error ? err : new Error('Cookie parse failed'));
      return;
    }

    const cookies = (socket.request as CookieRequest).cookies;
    const gid = parseGid(cookies?.['gid']);
    if (!gid) {
      next(refuse(ROOM_ERROR_CODES.IDENTITY_REQUIRED, 'Room identity required — open the app once, then rejoin.'));
      return;
    }

    socket.gid = gid;
    socket.userId = verifiedUserId(cookies?.[ACCESS_COOKIE]);
    socket.anonId = parseAnonId(cookies?.[ANON_COOKIE]);

    assertNotGloballyBanned({ gid, ...(socket.userId ? { userId: socket.userId } : {}) })
      .then(() => next())
      .catch((banErr: unknown) => {
        const code = ackCodeOf(banErr);
        if (code === 'unknown') logger.error({ err: banErr }, 'Room connect ban check failed');
        next(refuse(code, code === 'banned' ? 'You cannot join rooms.' : 'Rooms are unavailable right now.'));
      });
  });
};
