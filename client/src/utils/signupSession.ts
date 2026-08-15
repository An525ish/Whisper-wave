const KEY = 'ww_signup';

type SignupSession = {
  step: 1 | 2 | 3;
  email: string;
  signupToken: string;
};

export const saveSignupSession = (data: Partial<SignupSession>): void => {
  try {
    const prev = loadSignupSession() ?? {};
    sessionStorage.setItem(KEY, JSON.stringify({ ...prev, ...data }));
  } catch {
    // sessionStorage may be unavailable in private mode — fail silently
  }
};

export const loadSignupSession = (): SignupSession | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SignupSession;
  } catch {
    return null;
  }
};

export const clearSignupSession = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};
