import { AppError } from '../utils/AppError.js';
import { PendingSignup } from '../models/pendingSignup.js';
import type {
  CreatePendingSignupInput,
  PendingSignupPatch,
  PendingSignupRecord,
} from '../types/pendingSignup.js';

const byEmail = (email: string) => ({
  email: email.toLowerCase().trim(),
});

export const upsertByEmail = async (
  input: CreatePendingSignupInput
): Promise<PendingSignupRecord> => {
  const doc = await PendingSignup.findOneAndUpdate(
    byEmail(input.email),
    {
      $set: {
        passwordHash: input.passwordHash,
        otpHash: input.otpHash,
        otpExpiresAt: input.otpExpiresAt,
        otpAttempts: 0,
        expiresAt: input.expiresAt,
      },
      $unset: {
        username: 1,
        emailVerifiedAt: 1,
        signupTokenHash: 1,
        signupTokenExpiresAt: 1,
        lastResendAt: 1,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean<PendingSignupRecord>();

  if (!doc) {
    throw new AppError(500, 'Failed to create signup session');
  }

  return doc;
};

export const findByEmail = async (
  email: string
): Promise<PendingSignupRecord | null> =>
  PendingSignup.findOne(byEmail(email)).lean<PendingSignupRecord>();

export const updateByEmail = async (
  email: string,
  patch: PendingSignupPatch
): Promise<PendingSignupRecord | null> =>
  PendingSignup.findOneAndUpdate(byEmail(email), { $set: patch }, { new: true }).lean<PendingSignupRecord>();

export const incrementOtpAttempts = async (
  email: string
): Promise<PendingSignupRecord | null> =>
  PendingSignup.findOneAndUpdate(
    byEmail(email),
    { $inc: { otpAttempts: 1 } },
    { new: true }
  ).lean<PendingSignupRecord>();

export const findBySignupTokenHash = async (
  tokenHash: string
): Promise<PendingSignupRecord | null> =>
  PendingSignup.findOne({
    signupTokenHash: tokenHash,
    signupTokenExpiresAt: { $gt: new Date() },
    emailVerifiedAt: { $ne: null },
  })
    .select('+signupTokenHash')
    .lean<PendingSignupRecord>();

export const deleteById = async (id: string): Promise<void> => {
  await PendingSignup.findByIdAndDelete(id);
};
