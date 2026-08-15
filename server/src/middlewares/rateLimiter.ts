import rateLimit from 'express-rate-limit';

const jsonMessage = (message: string) => ({ success: false, message });

/** General auth routes: 20 req / 15 min per IP */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many email requests, please try again later'),
});

/** General API: 120 req / 60 s per IP */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many requests, please try again later'),
});

/** Search: 30 req / 60 s per IP */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many search requests, please try again later'),
});
