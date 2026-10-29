import 'express';
import type { Identity } from './identity.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isImpersonated?: boolean;
      impersonatingAdminId?: string;
      /** Guest-or-member identity resolved by `ensureGid`. Null until it runs. */
      identity?: Identity | null;
    }
  }
}

export {};
