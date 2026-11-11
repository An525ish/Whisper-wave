import { BoostWallet } from '../models/boostWallet.js';
import type { IBoostWalletFields } from '../types/subscription.js';

type WalletLean = Pick<IBoostWalletFields, 'credits' | 'activeUntil'>;

export const findByUser = async (userId: string): Promise<WalletLean | null> =>
  BoostWallet.findOne({ user: userId }).select('credits activeUntil -_id').lean<WalletLean>();

/** Add purchased credits. Upserts, and `$inc` makes two grants racing both count. */
export const addCredits = async (userId: string, credits: number): Promise<void> => {
  await BoostWallet.updateOne({ user: userId }, { $inc: { credits } }, { upsert: true });
};

/**
 * Spend one credit and push `activeUntil` out by `ms` from the later of now and its
 * current value. The `credits > 0` filter plus one atomic update means two taps can
 * never spend a credit that is not there. Returns the wallet BEFORE the change
 * (null = no credit), so a caller can undo it exactly.
 */
export const spendOne = async (userId: string, ms: number, now: Date = new Date()): Promise<WalletLean | null> =>
  BoostWallet.findOneAndUpdate(
    { user: userId, credits: { $gt: 0 } },
    [
      {
        $set: {
          credits: { $subtract: ['$credits', 1] },
          activeUntil: { $add: [{ $max: [{ $ifNull: ['$activeUntil', now] }, now] }, ms] },
        },
      },
    ],
    { returnDocument: 'before', updatePipeline: true, projection: { credits: 1, activeUntil: 1, _id: 0 } }
  ).lean<WalletLean>();

/** Undo `spendOne` when the boost could not be switched on. */
export const refund = async (userId: string, previousActiveUntil: Date | null): Promise<void> => {
  await BoostWallet.updateOne({ user: userId }, { $inc: { credits: 1 }, $set: { activeUntil: previousActiveUntil } });
};
