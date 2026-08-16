import type { LeanUser } from './user.js';

declare module 'socket.io' {
  interface Socket {
    user?: LeanUser;
    isImpersonated?: boolean;
  }
}

export {};
