import { env } from '../../config/env.js';
import type { AdminLoginResult } from '../../types/admin.js';
import { AppError } from '../../utils/AppError.js';
import {
  generateAdminToken,
  verifyAdminToken,
} from '../../utils/token.js';
import type { AdminLoginInput, AdminActionKeyInput } from '../../types/adminInput.js';
import { secretsEqual } from './shared.js';

export const login = async (
  input: AdminLoginInput
): Promise<AdminLoginResult> => {
  if (!env.ADMIN_SECRET) {
    throw new AppError(503, 'Admin login is not configured');
  }

  if (!secretsEqual(input.secretKey, env.ADMIN_SECRET)) {
    throw new AppError(401, 'Invalid admin credentials');
  }

  return { token: generateAdminToken() };
};

/** Re-check action key for sensitive ops (already authenticated). Not the login secret. */
export const verifyActionKey = (input: AdminActionKeyInput): void => {
  if (!env.ADMIN_ACTION_KEY) {
    throw new AppError(503, 'Admin action key is not configured');
  }
  if (!secretsEqual(input.actionKey, env.ADMIN_ACTION_KEY)) {
    throw new AppError(403, 'Invalid action key');
  }
};

export const me = (
  token: string | undefined
): { isAdmin: boolean } => {
  if (!token) return { isAdmin: false };
  try {
    verifyAdminToken(token);
    return { isAdmin: true };
  } catch {
    return { isAdmin: false };
  }
};
