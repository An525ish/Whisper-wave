import { create } from 'zustand';
import type { ProfileTab } from '../types';

type ProfileViewState = {
  /** Which half of the profile rail is showing. */
  tab: ProfileTab;
  /** The sheet below `lg`. Ignored at `lg`, where the rail is always visible. */
  sheetOpen: boolean;
  setTab: (tab: ProfileTab) => void;
  /** Jump straight to a tab — the header opens "them", the corner orb opens "you". */
  openSheet: (tab: ProfileTab) => void;
  closeSheet: () => void;
};

/**
 * UI state for the anon profile rail.
 *
 * A store rather than lifted `useState` because two siblings need it: the chat
 * header (tap the partner to see them) and the rail itself. Not persisted — a new
 * visit starts on "them", which is what you want to look at once matched.
 */
export const useProfileViewStore = create<ProfileViewState>((set) => ({
  tab: 'them',
  sheetOpen: false,
  setTab: (tab) => set({ tab }),
  openSheet: (tab) => set({ tab, sheetOpen: true }),
  closeSheet: () => set({ sheetOpen: false }),
}));
