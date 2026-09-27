import { create } from 'zustand';
import type { User } from '@/shared/types';
import { setSessionExpiredHandler } from '@/shared/lib/api/authBridge';

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

// Let the shared HTTP client clear the session on an unrecoverable 401 without
// importing this feature (preserves shared → features one-way dependency).
setSessionExpiredHandler(() => useAuthStore.getState().clear());
