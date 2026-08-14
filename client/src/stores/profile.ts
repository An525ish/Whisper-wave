import { create } from 'zustand';

type ProfileUiState = {
  /** When true, profile UI shows the signed-in user (editable). */
  viewSelfProfile: boolean;
  openSelfProfile: () => void;
  closeSelfProfile: () => void;
};

export const useProfileUiStore = create<ProfileUiState>((set) => ({
  viewSelfProfile: false,
  openSelfProfile: () => set({ viewSelfProfile: true }),
  closeSelfProfile: () => set({ viewSelfProfile: false }),
}));
