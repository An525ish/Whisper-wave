import { z } from 'zod';

/**
 * Persist the full signup wizard in localStorage so a user who verified OTP
 * (step 2) and left mid-profile (step 3) can reopen "Create account" and land
 * on step 3 — even after closing the tab.
 *
 * Security: signupToken is hashed server-side and expires in 30 minutes.
 * Cleared on successful complete or explicit "Back" to step 1.
 */
const KEY = 'ww_signup';

const signupSessionSchema = z.object({
  step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  email: z.string(),
  signupToken: z.string(),
  username: z.string().optional(),
});

export type SignupSession = z.infer<typeof signupSessionSchema>;

export const saveSignupSession = (data: Partial<SignupSession>): void => {
  try {
    const prev = loadSignupSession() ?? { step: 1 as const, email: '', signupToken: '' };
    localStorage.setItem(KEY, JSON.stringify({ ...prev, ...data }));
  } catch {
    // localStorage may be unavailable in private mode — fail silently
  }
};

export const loadSignupSession = (): SignupSession | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const result = signupSessionSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;

    const session = result.data;
    // Verified users always resume at profile finish — never bounce to step 1
    if (session.signupToken && session.step < 3) {
      return { ...session, step: 3 };
    }
    return session;
  } catch {
    return null;
  }
};

export const clearSignupSession = (): void => {
  try {
    localStorage.removeItem(KEY);
    // Migrate away from the old split-key layout if present
    localStorage.removeItem('ww_signup_token');
    sessionStorage.removeItem('ww_signup');
  } catch {
    // ignore
  }
};
