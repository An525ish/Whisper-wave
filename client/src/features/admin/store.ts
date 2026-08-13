import { create } from 'zustand';

type AdminState = {
  isAdmin: boolean;
  bootstrapped: boolean;
  setAdmin: (isAdmin: boolean) => void;
  clear: () => void;
};

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  bootstrapped: false,
  setAdmin: (isAdmin) => set({ isAdmin, bootstrapped: true }),
  clear: () => set({ isAdmin: false, bootstrapped: true }),
}));
