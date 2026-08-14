import { create } from 'zustand';
import type { User } from '@/types';

type AuthState = {
  user: User | null;
  bootstrapped: boolean;
  setUser: (user: User | null) => void;
  clear: () => void;
  setBootstrapped: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  bootstrapped: false,
  setUser: (user) => set({ user, bootstrapped: true }),
  clear: () => set({ user: null, bootstrapped: true }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
}));
