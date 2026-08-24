/** Signup / password-reset timing — used by auth services only. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const PENDING_TTL_MS = 30 * 60 * 1000;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const SIGNUP_TOKEN_TTL_MS = 30 * 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;

/** Placeholder when signup/Google creates an account without a photo. */
export const DEFAULT_USER_AVATAR = {
  publicId: 'no-dp',
  url: '/icons/no-dp.svg',
} as const;
