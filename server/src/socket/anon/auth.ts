import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import type { IncomingMessage } from 'http';
import type { ExtendedError } from 'socket.io';
import type { AnonSocket } from './types.js';
import { AppError } from '../../utils/AppError.js';

/** The parsed request shape cookie-parser produces. */
type CookieRequest = IncomingMessage & { cookies?: Record<string, string> };

/**
 * Socket.IO middleware for the /anon namespace.
 *
 * Parses the httpOnly `anonId` cookie and attaches it to the socket.
 * No JWT or DB lookup — the HTTP `POST /api/match/join` already validated
 * the user and issued the cookie.
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
    next();
  });
};
