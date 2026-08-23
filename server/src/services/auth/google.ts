import { randomBytes, randomInt } from 'node:crypto';
import { hash } from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import * as userRepo from '../../repositories/user.js';
import type { AuthResult } from '../../types/user.js';
import { AppError } from '../../utils/AppError.js';
import { uploadUrlToCloudinary } from '../../utils/cloudinary.js';
import { generateToken } from '../../utils/token.js';
import { env } from '../../config/env.js';
import type { GoogleSignInInput } from '../../validators/auth.js';
import { assertAcceptableEmail, normalizeEmail, toPublicUser } from './shared.js';

const googleClient = new OAuth2Client();

const deriveUsername = async (displayName: string): Promise<string> => {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20) || 'user';

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? base : `${base}_${randomInt(1000, 9999)}`;
    const taken = await userRepo.findByUsername(candidate);
    if (!taken) return candidate;
  }

  return `${base}_${Date.now().toString(36)}`;
};

type GoogleIdentity = {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
};

const resolveGoogleIdentity = async (
  input: GoogleSignInInput
): Promise<GoogleIdentity> => {
  if (input.credential) {
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: input.credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new AppError(401, 'Invalid Google credential. Please try again.');
    }

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new AppError(401, 'Google account does not have a verified email.');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || 'Whisper User',
      picture: payload.picture,
    };
  }

  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${input.accessToken}` },
    });
    if (!res.ok) {
      throw new AppError(401, 'Invalid Google token. Please try again.');
    }
    const profile = (await res.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean | string;
      name?: string;
      picture?: string;
    };
    const verified =
      profile.email_verified === true || profile.email_verified === 'true';
    if (!profile.sub || !profile.email || !verified) {
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

export const googleSignIn = async (
  input: GoogleSignInInput
): Promise<AuthResult> => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, 'Google Sign-In is not configured on this server.');
  }

  const { googleId, email, name, picture } = await resolveGoogleIdentity(input);
  const normalizedEmail = normalizeEmail(email);

  const existingByGoogle = await userRepo.findByGoogleId(googleId);
  if (existingByGoogle) {
    return {
      token: generateToken(existingByGoogle._id.toString()),
      message: `Welcome back, ${existingByGoogle.name}`,
      user: toPublicUser(existingByGoogle),
    };
  }

  const existingByEmail = await userRepo.findByEmail(normalizedEmail);
  if (existingByEmail) {
    await userRepo.updateById(existingByEmail._id.toString(), { googleId });
    return {
      token: generateToken(existingByEmail._id.toString()),
      message: `Welcome back, ${existingByEmail.name}`,
      user: toPublicUser(existingByEmail),
    };
  }

  assertAcceptableEmail(normalizedEmail);

  let avatar: { publicId: string; url: string };
  try {
    avatar = picture
      ? await uploadUrlToCloudinary(picture)
      : { publicId: 'no-avatar', url: '/images/no-avatar.svg' };
  } catch {
    avatar = { publicId: 'no-avatar', url: '/images/no-avatar.svg' };
  }

  const username = await deriveUsername(name);
  const randomPassword = await hash(randomBytes(32).toString('hex'), 10);

  const newUser = await userRepo.create({
    name,
    username,
    email: normalizedEmail,
    password: randomPassword,
    googleId,
    avatar,
  });

  return {
    token: generateToken(newUser._id.toString()),
    message: `Welcome to Whisper Wave, ${newUser.name}`,
    user: toPublicUser(newUser),
  };
};
