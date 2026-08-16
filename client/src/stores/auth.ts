import { create } from 'zustand';
import type { User } from '@/types';

type AuthState = {
  user: User | null;
  bootstrapped: boolean;
  /** True when the current session is an admin impersonation (ghost mode) */
  isImpersonated: boolean;
  /** When true, the ghost banner has been toggled to "Act as user" — sends are allowed */
  actAsUser: boolean;
  setUser: (user: User | null) => void;
  setImpersonated: (value: boolean) => void;
  setActAsUser: (value: boolean) => void;
  clear: () => void;
  setBootstrapped: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  bootstrapped: false,
  isImpersonated: false,
  actAsUser: false,
  setUser: (user) => set({ user, bootstrapped: true }),
  setImpersonated: (isImpersonated) => set({ isImpersonated }),
  setActAsUser: (actAsUser) => set({ actAsUser }),
  clear: () => set({ user: null, bootstrapped: true, isImpersonated: false, actAsUser: false }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
}));
