import jwt from 'jsonwebtoken';
import { adminTokenSecret, env } from '../config/env.js';
import type { AdminTokenPayload } from '../types/admin.js';
import { AppError } from './AppError.js';

export type TokenPayload = {
  id: string;
  impersonated?: true;
  /** Present only when impersonated is true */
  adminId?: string;
};

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15d',
  } as jwt.SignOptions);
};

export const generateImpersonationToken = (
  userId: string,
  adminId: string
): string => {
  const payload: TokenPayload = { id: userId, impersonated: true, adminId };
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: '2h',
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as TokenPayload;
    if (!payload?.id) {
      throw new AppError(401, 'Invalid token');
    }
    return payload;
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
};

export const generateAdminToken = (): string => {
  return jwt.sign({ role: 'admin' } satisfies AdminTokenPayload, adminTokenSecret, {
    expiresIn: '8h',
  } as jwt.SignOptions);
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  try {
    const payload = jwt.verify(token, adminTokenSecret) as AdminTokenPayload;
    if (payload?.role !== 'admin') {
      throw new AppError(401, 'Invalid admin token');
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'Invalid or expired admin token');
  }
};
