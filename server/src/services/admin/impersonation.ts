import * as impersonationLogRepo from '../../repositories/impersonationLog.js';
import type { ImpersonationLogPage } from '../../repositories/impersonationLog.js';
import * as userRepo from '../../repositories/user.js';
import { AppError } from '../../utils/AppError.js';
import { generateImpersonationToken } from '../../utils/token.js';

export const impersonateUser = async (
  userId: string,
  adminId: string
): Promise<string> => {
  const user = await userRepo.findByIdLean(userId);
  if (!user) throw new AppError(404, 'User not found');

  await impersonationLogRepo.create({
    adminId: adminId ?? 'admin',
    targetUserId: user._id,
    targetUsername: user.username,
    targetName: user.name,
    startedAt: new Date(),
  });

  return generateImpersonationToken(userId, adminId);
};

export const getImpersonationLogs = async (
  limit: number,
  before?: string
): Promise<ImpersonationLogPage> => {
  const beforeDate = before ? new Date(before) : undefined;
  return impersonationLogRepo.findPaginated(limit, beforeDate);
};
