import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IBoostWalletFields } from '../types/subscription.js';

export type IBoostWallet = IBoostWalletFields & Document;

/**
 * One row per account: unused boost credits and when the running boost ends.
 * Written only through atomic updates (see the repository), never read-modify-write.
 */
const boostWalletSchema = new Schema<IBoostWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    credits: { type: Number, required: true, default: 0, min: 0 },
    activeUntil: { type: Date, default: null },
  },
  { timestamps: false }
);

export const BoostWallet =
  (mongoose.models.BoostWallet as mongoose.Model<IBoostWallet> | undefined) ||
  model<IBoostWallet>('BoostWallet', boostWalletSchema);
