import type { CookieOptions } from 'express';
import type { CorsOptions } from 'cors';
import { env, isProd } from './env.js';

/**
 * Short-lived access token cookie (15 min).
 * SameSite: 'none' in prod so cross-origin XHR with credentials works.
 */
export const accessCookieOptions: CookieOptions = {
  maxAge: 15 * 60 * 1000, // 15 minutes
  sameSite: isProd ? 'none' : 'lax',
  httpOnly: true,
  secure: isProd,
};

/**
 * Long-lived refresh token cookie (7 days).
 * No explicit path — Express defaults to '/', same as accessToken, so
 * Set-Cookie from sign-in/refresh/sign-out and clearCookie on sign-out stay in sync.
 */
export const refreshCookieOptions: CookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: isProd ? 'strict' : 'lax',
  httpOnly: true,
  secure: isProd,
};

/**
 * Anonymous session identity cookie (24 h).
 * Set when a guest hits POST /api/match/join.
 * httpOnly so the client can't read/forge the anonId.
 * No path scope — socket auth middleware reads it on the /anon handshake.
 */
export const anonCookieOptions: CookieOptions = {
  maxAge: 24 * 60 * 60 * 1000, // 24 h — matches session TTL
  sameSite: isProd ? 'none' : 'lax',
  httpOnly: true,
  secure: isProd,
};

/**
 * Stable guest identity cookie (30 days, see `GID_COOKIE_TTL_DAYS`).
 * Minted by the `ensureGid` middleware on first API contact.
 * httpOnly so the client can't read/forge the gid — same `sameSite`/`secure`
 * posture as `anonId`, since it travels on the same requests.
 */
export const gidCookieOptions: CookieOptions = {
  maxAge: env.GID_COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000,
  sameSite: isProd ? 'none' : 'lax',
  httpOnly: true,
  secure: isProd,
};

export const corsOptions: CorsOptions = {
  origin: [
    ...(env.CLIENT_URL ? [env.CLIENT_URL] : []),
  ],
  credentials: true,
};
