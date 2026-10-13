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
