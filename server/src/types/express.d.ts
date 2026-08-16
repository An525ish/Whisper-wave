import 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isImpersonated?: boolean;
      impersonatingAdminId?: string;
    }
  }
}

export {};
