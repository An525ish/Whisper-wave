/**
 * Auth bridge — lets the shared HTTP client signal "session expired" without
 * importing the auth feature (which would violate shared → features one-way
 * dependency). The auth feature registers a handler on startup; the client
 * only knows about this neutral seam.
 */
let sessionExpiredHandler: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: (() => void) | null): void => {
  sessionExpiredHandler = handler;
};

export const notifySessionExpired = (): void => {
  sessionExpiredHandler?.();
};

/**
 * Sign-out seam — features that hold server-side state tied to the session
 * (e.g. push device tokens) register cleanup here; it runs, best effort,
 * before the signout request clears the auth cookies.
 */
let beforeSignOutHandler: (() => Promise<void>) | null = null;

export const setBeforeSignOutHandler = (handler: (() => Promise<void>) | null): void => {
  beforeSignOutHandler = handler;
};

export const runBeforeSignOut = async (): Promise<void> => {
  try {
    await beforeSignOutHandler?.();
  } catch {
    // Cleanup must never block logout.
  }
};
