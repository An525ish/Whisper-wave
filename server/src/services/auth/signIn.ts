import { compare } from 'bcrypt';
import * as userRepo from '../../repositories/user.js';
import type { AuthResult } from '../../types/user.js';
import { AppError } from '../../utils/AppError.js';
import { generateToken } from '../../utils/token.js';
import type { SignInInput } from '../../validators/auth.js';
import { toPublicUser } from './shared.js';

export const signIn = async (input: SignInInput): Promise<AuthResult> => {
  const user = await userRepo.findByUsernameWithPassword(input.username);
  if (!user) throw new AppError(401, 'Invalid Credentials');

  const isMatch = await compare(input.password, user.password);
  if (!isMatch) throw new AppError(401, 'Invalid Credentials');

  return {
    token: generateToken(user._id.toString()),
    message: `Welcome back, ${user.name}`,
    user: toPublicUser(user),
  };
};
