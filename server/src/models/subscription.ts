import mongoose, { Schema, model, type Document } from 'mongoose';
import type { ISubscriptionFields } from '../types/subscription.js';

export type ISubscription = ISubscriptionFields & Document;

/**
 * One row per account: the pass is "active" while `expiresAt` is in the future.
 * No `timestamps`: grants are written with an aggregation-pipeline update (so
 * extending is atomic), and `updatedAt` is set in that pipeline.
 */
const subscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    planId: { type: String, enum: ['day', 'week', 'month', 'year'], required: true },
    expiresAt: { type: Date, required: true },
    source: { type: String, enum: ['razorpay', 'admin'], required: true },
    updatedAt: { type: Date, required: true },
  },
  { timestamps: false }
);

export const Subscription =
  (mongoose.models.Subscription as mongoose.Model<ISubscription> | undefined) ||
  model<ISubscription>('Subscription', subscriptionSchema);
