import rateLimit from 'express-rate-limit';

const jsonMessage = (message: string) => ({ success: false, message });

/** General auth routes: 20 req / 15 min per IP */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many auth attempts, please try again later'),
});

/**
 * Email-sending routes (signup/start, signup/resend, forgot-password):
 * 5 req / 15 min per IP. Prevents inbox flooding.
 */
export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many email requests, please try again later'),
});

/** General API: 120 req / 60 s per IP */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many requests, please try again later'),
});

/** Search: 30 req / 60 s per IP */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many search requests, please try again later'),
});

/**
 * Username update during signup (PATCH /signup/username):
 * 10 req / 15 min per IP — tight enough to prevent username enumeration
 * but lenient enough for a real user trying a few alternatives.
 */
export const signupUsernameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many username attempts, please try again later'),
});

/**
 * Username availability check (GET /auth/username/check):
 * 30 req / 15 min per IP — debounced on the client so real users rarely
 * hit this, but tight enough to prevent bulk enumeration.
 */
export const usernameCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many username checks, please try again later'),
});
