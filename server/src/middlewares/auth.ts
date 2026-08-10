import type { IncomingMessage } from 'http';
import type { NextFunction, Request, Response } from 'express';
import type { Socket } from 'socket.io';
import cookieParser from 'cookie-parser';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/token.js';
import { User } from '../models/user.js';
import type { LeanUser } from '../types/user.js';

/** JWT-only auth — no DB hit on every HTTP request. */
export const auth = (req: Request, _res: Response, next: NextFunction): void => {
  const accessToken = (req.cookies as { accessToken?: string } | undefined)
    ?.accessToken;

  if (!accessToken) {
    next(new AppError(401, 'Please SignIn to access the resource'));
    return;
  }

  try {
    const payload = verifyToken(accessToken);
    req.userId = payload.id;
    next();
  } catch (error) {
    next(error);
  }
};

type CookieRequest = IncomingMessage & {
  cookies?: { accessToken?: string };
};

/** Loads the user once on socket connect (needed for message fan-out). */
export const socketAuth = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const accessToken = (socket.request as CookieRequest).cookies?.accessToken;

    if (!accessToken) {
      next(new AppError(401, 'Please SignIn to access the resource'));
      return;
    }

    const { id } = verifyToken(accessToken);
    const user = await User.findById(id).lean<LeanUser>();

    if (!user) {
      next(new AppError(401, 'No user found'));
      return;
    }

    socket.user = user;
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Socket auth failed'));
  }
};

export const applySocketAuth = (
  socket: Socket,
  next: (err?: Error) => void
): void => {
  const parseCookies = cookieParser();

  parseCookies(
    socket.request as Request,
    {} as Response,
    (err?: unknown) => {
      if (err) {
        next(err instanceof Error ? err : new Error('Cookie parse failed'));
        return;
      }
      void socketAuth(socket, next);
    }
  );
};
