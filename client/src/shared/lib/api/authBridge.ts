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
