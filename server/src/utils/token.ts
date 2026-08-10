import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

export type TokenPayload = {
  id: string;
};

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15d',
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
