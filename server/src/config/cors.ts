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

export const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    ...(env.CLIENT_URL ? [env.CLIENT_URL] : []),
  ],
  credentials: true,
};
