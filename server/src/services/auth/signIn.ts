import { compare, hash } from 'bcrypt';
import * as userRepo from '../../repositories/user.js';
import type { AuthResult } from '../../types/user.js';
import { AppError } from '../../utils/AppError.js';
import type { SignInInput } from '../../validators/auth.js';
import { issueAuthTokens, toPublicUser } from './shared.js';

// A pre-hashed dummy value used for constant-time comparison when user is not
// found, preventing username enumeration via response-time differences.
const DUMMY_HASH = await hash('dummy-password-for-timing-safety', 10);

export const signIn = async (input: SignInInput): Promise<AuthResult> => {
  const user = await userRepo.findByUsernameWithPassword(input.username);

  // Always run bcrypt whether or not the user exists to equalise response time.
  const hashToCheck = user?.password ?? DUMMY_HASH;
  const isMatch = await compare(input.password, hashToCheck);

  if (!user || !isMatch) throw new AppError(401, 'Invalid Credentials');

  const { accessToken, refreshToken } = await issueAuthTokens(user._id.toString());

  return {
    accessToken,
    refreshToken,
    message: `Welcome back, ${user.name}`,
    user: toPublicUser(user),
  };
};
