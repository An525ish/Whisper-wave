import { create } from 'zustand';

type AdminState = {
  isAdmin: boolean;
  setAdmin: (isAdmin: boolean) => void;
  clear: () => void;
};

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  setAdmin: (isAdmin) => set({ isAdmin }),
  clear: () => set({ isAdmin: false }),
}));
