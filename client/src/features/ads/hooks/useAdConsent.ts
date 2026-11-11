import { create } from 'zustand';
import type { AdConsent } from '../types';

const KEY = 'ww-ad-consent';

const read = (): AdConsent | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'declined' ? v : null;
  } catch {
    return null; // storage blocked: treat as "not asked", never as consent
  }
};

type State = { choice: AdConsent | null; set: (c: AdConsent | null) => void };

/**
 * The person's answer to "show ads?". Kept on this device only. Nothing loads
 * from an ad network until it is `granted`, and they can change it later.
 */
export const useAdConsent = create<State>((set) => ({
  choice: read(),
  set: (choice) => {
    try {
      if (choice) localStorage.setItem(KEY, choice);
      else localStorage.removeItem(KEY);
    } catch {
      /* in-memory only for this session */
    }
    set({ choice });
  },
}));
