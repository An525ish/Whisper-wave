import type { Types } from 'mongoose';

export type PendingSignupRecord = {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  otpHash: string;
  otpExpiresAt: Date;
  otpAttempts: number;
  username?: string;
  emailVerifiedAt?: Date;
  signupTokenHash?: string;
  signupTokenExpiresAt?: Date;
  lastResendAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePendingSignupInput = {
  email: string;
  passwordHash: string;
  otpHash: string;
  otpExpiresAt: Date;
  expiresAt: Date;
};

export type PendingSignupPatch = Partial<{
  otpHash: string;
  otpExpiresAt: Date;
  otpAttempts: number;
  username: string;
  emailVerifiedAt: Date;
  signupTokenHash: string;
  signupTokenExpiresAt: Date;
  expiresAt: Date;
  lastResendAt: Date;
}>;
