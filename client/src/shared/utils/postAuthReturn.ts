/**
 * "Come back here after you sign in." Gated features stash the in-app path a
 * guest was on (invite query included) just before sending them to /auth; the
 * root route spends it once, right after sign-in, instead of landing on home.
 * sessionStorage: same tab only, gone when the tab closes, never sent anywhere.
 */
const KEY = 'ww_post_auth_return';

/** Only same-origin in-app paths — never `//host` or a full URL. */
const isSafePath = (path: string): boolean => path.startsWith('/') && !path.startsWith('//') && !path.includes('\\');

export const stashPostAuthReturn = (path: string): void => {
  if (!isSafePath(path)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Storage blocked (private mode): sign-in still works, they just land on home.
  }
};

/** Pure read (safe to call during render, StrictMode included). Null when nothing safe is stashed. */
export const peekPostAuthReturn = (): string | null => {
  try {
    const path = sessionStorage.getItem(KEY);
    return path && isSafePath(path) ? path : null;
  } catch {
    return null;
  }
};

/** Spend it: call from an effect once the redirect has been issued. */
export const clearPostAuthReturn = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
};
