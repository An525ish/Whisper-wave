import { RoomReminder } from '../models/roomReminder.js';

/** Idempotent: a second subscribe for the same (user, room) is a no-op. */
export const create = async (userId: string, slug: string): Promise<void> => {
  await RoomReminder.updateOne(
    { userId, slug },
    { $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
};

export const remove = async (userId: string, slug: string): Promise<void> => {
  await RoomReminder.deleteOne({ userId, slug });
};

export const countForUser = (userId: string): Promise<number> =>
  RoomReminder.countDocuments({ userId });

export const listSlugsForUser = async (userId: string): Promise<string[]> => {
  const docs = await RoomReminder.find({ userId }).select('slug').lean();
  return docs.map((d) => d.slug);
};

export const distinctSlugs = (): Promise<string[]> => RoomReminder.distinct('slug');

/** Consume a room's reminders: returns the subscribers and deletes exactly those rows. */
export const takeBySlug = async (slug: string): Promise<string[]> => {
  const docs = await RoomReminder.find({ slug }).select('_id userId').lean();
  if (docs.length === 0) return [];
  await RoomReminder.deleteMany({ _id: { $in: docs.map((d) => d._id) } });
  return docs.map((d) => String(d.userId));
};

/** Room deleted: drop every subscription to it. */
export const removeForSlug = async (slug: string): Promise<void> => {
  await RoomReminder.deleteMany({ slug });
};
