/** Signup / password-reset timing — used by auth services only. */

export const RESET_TOKEN_TTL_MS  = 60 * 60 * 1000;    // 1 hour
export const PENDING_TTL_MS      = 30 * 60 * 1000;    // 30 minutes
export const OTP_TTL_MS          = 10 * 60 * 1000;    // 10 minutes
export const SIGNUP_TOKEN_TTL_MS = 30 * 60 * 1000;    // 30 minutes
export const RESEND_COOLDOWN_MS  = 60 * 1000;         // 1 minute

export const MAX_OTP_ATTEMPTS = 5;

/** Placeholder when signup/Google creates an account without a photo. */
export const DEFAULT_USER_AVATAR = {
  publicId: 'no-dp',
  url: '/icons/no-dp.svg',
} as const;
