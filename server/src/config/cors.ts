import type { CookieOptions } from 'express';
import type { CorsOptions } from 'cors';
import { env, isProd } from './env.js';

export const cookieOptions: CookieOptions = {
  maxAge: 1000 * 60 * 60 * 24 * 15,
  sameSite: isProd ? 'none' : 'lax',
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
