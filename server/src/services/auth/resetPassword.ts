import { hash } from 'bcrypt';
import * as userRepo from '../../repositories/user.js';
import { AppError } from '../../utils/AppError.js';
import type { ResetPasswordInput } from '../../validators/auth.js';
import { sha256 } from './shared.js';

export const resetPassword = async (
  input: ResetPasswordInput
): Promise<{ message: string }> => {
  const tokenHash = sha256(input.token);
  const user = await userRepo.findByPasswordResetToken(tokenHash);

  if (!user) throw new AppError(400, 'Reset link is invalid or has expired');

  const hashedPassword = await hash(input.password, 10);
  await Promise.all([
    userRepo.updateById(user._id.toString(), { password: hashedPassword }),
    userRepo.clearPasswordReset(user._id.toString()),
  ]);

  return { message: 'Password updated. You can sign in now.' };
};
