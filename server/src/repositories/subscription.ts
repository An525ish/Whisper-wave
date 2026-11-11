import { Types } from 'mongoose';
import { Subscription } from '../models/subscription.js';
import type { ISubscriptionFields, PassSource, PlanId } from '../types/subscription.js';

type SubscriptionLean = Pick<ISubscriptionFields, 'planId' | 'expiresAt' | 'source'>;

export const findByUser = async (userId: string): Promise<SubscriptionLean | null> =>
  Subscription.findOne({ user: userId })
    .select('planId expiresAt source -_id')
    .lean<SubscriptionLean>();

/** Which of these accounts have a pass live right now? Used by the admin user list. */
export const activePassUserIds = async (
  userIds: string[],
  now: Date = new Date()
): Promise<Set<string>> => {
  const ids = userIds.filter((id) => Types.ObjectId.isValid(id));
  if (ids.length === 0) return new Set();
  const rows = await Subscription.find({
    user: { $in: ids.map((id) => new Types.ObjectId(id)) },
    expiresAt: { $gt: now },
  })
    .select('user -_id')
    .lean<{ user: Types.ObjectId }[]>();
  return new Set(rows.map((r) => String(r.user)));
};

/** User ids with a pass live now. For admin directory filter. */
export const distinctActivePassUserIds = async (now: Date = new Date()): Promise<Types.ObjectId[]> =>
  Subscription.distinct('user', { expiresAt: { $gt: now } });

/**
 * Add `ms` to the pass: from the later of now and the current expiry, so an early
 * renewal never loses the time that is left. One atomic pipeline update (no
 * read-modify-write), so two grants racing cannot overwrite each other.
 */
export const extend = async (
  userId: string,
  planId: PlanId,
  ms: number,
  source: PassSource,
  now: Date = new Date()
): Promise<SubscriptionLean> =>
  (await Subscription.findOneAndUpdate(
    { user: userId },
    [
      {
        $set: {
          expiresAt: { $add: [{ $max: [{ $ifNull: ['$expiresAt', now] }, now] }, ms] },
          planId,
          source,
          updatedAt: now,
        },
      },
    ],
    { upsert: true, returnDocument: 'after', updatePipeline: true, projection: { planId: 1, expiresAt: 1, source: 1, _id: 0 } }
  ).lean<SubscriptionLean>())!;

/** Admin revoke: expire the pass now. Returns false when the account never had one. */
export const expireNow = async (userId: string, now: Date = new Date()): Promise<boolean> => {
  const res = await Subscription.updateOne(
    { user: userId },
    { $set: { expiresAt: now, updatedAt: now } }
  );
  return res.matchedCount > 0;
};
