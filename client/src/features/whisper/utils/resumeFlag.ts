import { WHISPER_RESUME_KEY } from '../constants';

/**
 * Non-secret "a match was live in this tab" marker. It carries no identity or
 * token — the server authorises the resume by the httpOnly anonId cookie.
 * Storage failures (private mode) just mean no refresh-restore.
 */
export const setResumeFlag = (): void => {
  try {
    window.sessionStorage.setItem(WHISPER_RESUME_KEY, '1');
  } catch {
    // Storage unavailable: refresh simply lands on the picker.
  }
};

export const clearResumeFlag = (): void => {
  try {
    window.sessionStorage.removeItem(WHISPER_RESUME_KEY);
    window.sessionStorage.removeItem('ww.anon.live');
  } catch {
    // Nothing to clear.
  }
};

export const hasResumeFlag = (): boolean => {
  try {
    return window.sessionStorage.getItem(WHISPER_RESUME_KEY) === '1';
  } catch {
    return false;
  }
};

const LIVE_IDENTITY_KEY = 'ww.anon.live';

/**
 * Tab-scoped copy of who you are in the live match. A refresh empties the store and
 * the server only replays the partner's side, so without this the You panel came
 * back with no vibes (localStorage only has them when "Remember" is on).
 */
export const writeLiveIdentity = (value: unknown): void => {
  try {
    window.sessionStorage.setItem(LIVE_IDENTITY_KEY, JSON.stringify(value));
  } catch {
    // Storage unavailable: the panel just starts empty after a refresh.
  }
};

export const readLiveIdentity = (): Record<string, unknown> | null => {
  try {
    const raw = window.sessionStorage.getItem(LIVE_IDENTITY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};
