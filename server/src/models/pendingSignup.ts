import mongoose, { Schema, model, type Document } from 'mongoose';
import type { PendingSignupRecord } from '../types/pendingSignup.js';

export type IPendingSignup = PendingSignupRecord & Document;

const pendingSignupSchema = new Schema<IPendingSignup>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    otpAttempts: { type: Number, default: 0 },
    username: { type: String, trim: true },
    emailVerifiedAt: { type: Date },
    signupTokenHash: { type: String, select: false },
    signupTokenExpiresAt: { type: Date },
    lastResendAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingSignup =
  (mongoose.models.PendingSignup as mongoose.Model<IPendingSignup> | undefined) ||
  model<IPendingSignup>('PendingSignup', pendingSignupSchema);
