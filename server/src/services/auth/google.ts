import { randomBytes } from 'node:crypto';
import { hash } from 'bcrypt';
import * as userRepo from '../../repositories/user.js';
import type { AuthResult, LeanUser } from '../../types/user.js';
import { AppError } from '../../utils/AppError.js';
import { deriveUsername } from '../../utils/helper.js';
import { resolveOAuthAvatar } from '../../utils/avatar.js';
import { env } from '../../config/env.js';
import type { GoogleSignInInput } from '../../validators/auth.js';
import { normalizeEmail } from '../../utils/normalize.js';
import { assertAcceptableEmail, issueAuthResult } from './shared.js';

type GoogleIdentity = {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
};

type GoogleTokenInfo = { aud?: string };

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
};

const isGoogleEmailVerified = (value: boolean | string | undefined): boolean =>
  value === true || value === 'true';

const assertAccessTokenAudience = async (accessToken: string): Promise<void> => {
  const url = `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new AppError(401, 'Invalid Google token. Please try again.');
  }

  const { aud } = (await res.json()) as GoogleTokenInfo;
  if (aud !== env.GOOGLE_CLIENT_ID) {
    throw new AppError(401, 'Google token was not issued for this application.');
  }
};

const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new AppError(401, 'Invalid Google token. Please try again.');
  }
  return res.json() as Promise<GoogleUserInfo>;
};

const resolveGoogleIdentity = async ({
  accessToken,
}: GoogleSignInInput): Promise<GoogleIdentity> => {
  try {
    await assertAccessTokenAudience(accessToken);
    const profile = await fetchGoogleUserInfo(accessToken);

    if (!profile.sub || !profile.email || !isGoogleEmailVerified(profile.email_verified)) {
      throw new AppError(401, 'Google account does not have a verified email.');
    }

    return {
      googleId: profile.sub,
      email: profile.email,
      name: profile.name || 'Whisper User',
      picture: profile.picture,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'Could not verify Google account. Please try again.');
  }
};

const linkGoogleAccount = async (
  googleId: string,
  email: string
): Promise<LeanUser | null> => {
  const user = await userRepo.findByEmail(email);
  if (!user) return null;

  await userRepo.updateById(user._id.toString(), { googleId });
  return user;
};

export const googleSignIn = async (
  input: GoogleSignInInput
): Promise<AuthResult> => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, 'Google Sign-In is not configured on this server.');
  }

  const { googleId, email, name, picture } = await resolveGoogleIdentity(input);
  const normalizedEmail = normalizeEmail(email);

  const existingUser =
    (await userRepo.findByGoogleId(googleId)) ??
    (await linkGoogleAccount(googleId, normalizedEmail));

  if (existingUser) {
    return issueAuthResult(existingUser, `Welcome back, ${existingUser.name}`);
  }

  assertAcceptableEmail(normalizedEmail);

  const [username, password, avatar] = await Promise.all([
    deriveUsername(name),
    hash(randomBytes(32).toString('hex'), 10),
    resolveOAuthAvatar(picture),
  ]);

  const newUser = await userRepo.create({
    name,
    username,
    email: normalizedEmail,
    password,
    googleId,
    avatar,
  });

  return issueAuthResult(newUser, `Welcome to Whisper Wave, ${newUser.name}`);
};
