import { PushDevice } from '../models/pushDevice.js';
import type { RegisterPushDeviceInput } from '../types/push.js';

/** A token belongs to one user: re-registering moves it to the caller. */
export const upsertByToken = async (input: RegisterPushDeviceInput): Promise<void> => {
  await PushDevice.updateOne(
    { token: input.token },
    {
      $set: {
        userId: input.userId,
        platform: input.platform,
        userAgent: input.userAgent,
        lastSeenAt: new Date(),
      },
    },
    { upsert: true }
  );
};

/** Delete every device beyond the newest `keep` for the user. */
export const trimToNewest = async (userId: string, keep: number): Promise<void> => {
  const stale = await PushDevice.find({ userId })
    .sort({ lastSeenAt: -1 })
    .skip(keep)
    .select('_id')
    .lean();
  if (stale.length === 0) return;
  await PushDevice.deleteMany({ _id: { $in: stale.map((d) => d._id) } });
};

export const deleteByUserAndToken = async (userId: string, token: string): Promise<void> => {
  await PushDevice.deleteOne({ userId, token });
};

export const deleteByTokens = async (tokens: string[]): Promise<void> => {
  if (tokens.length === 0) return;
  await PushDevice.deleteMany({ token: { $in: tokens } });
};

export const deleteAllForUser = async (userId: string): Promise<void> => {
  await PushDevice.deleteMany({ userId });
};

export const findTokensByUserIds = async (userIds: string[]): Promise<string[]> => {
  if (userIds.length === 0) return [];
  const docs = await PushDevice.find({ userId: { $in: userIds } })
    .select('token')
    .lean();
  return docs.map((d) => d.token);
};
