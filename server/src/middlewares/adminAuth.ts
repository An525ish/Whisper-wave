import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { verifyAdminToken } from '../utils/token.js';

/** Verifies httpOnly adminToken JWT with payload `{ role: 'admin' }`. */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const adminToken = (req.cookies as { adminToken?: string } | undefined)
    ?.adminToken;

  if (!adminToken) {
    next(new AppError(401, 'Admin authentication required'));
    return;
  }

  try {
    verifyAdminToken(adminToken);
    next();
  } catch (error) {
    next(error);
  }
};
