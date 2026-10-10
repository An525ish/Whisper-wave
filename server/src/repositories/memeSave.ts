import { MemeSave } from '../models/memeSave.js';

/** Idempotent — re-saving returns the existing row. */
export const save = async (params: {
  userId: string;
  source: string;
  externalId: number;
}): Promise<void> => {
  await MemeSave.updateOne(
    { user: params.userId, source: params.source, externalId: params.externalId },
    { $setOnInsert: { user: params.userId, source: params.source, externalId: params.externalId, createdAt: new Date() } },
    { upsert: true }
  );
};

export const unsave = async (params: {
  userId: string;
  source: string;
  externalId: number;
}): Promise<boolean> => {
  const res = await MemeSave.deleteOne({
    user: params.userId,
    source: params.source,
    externalId: params.externalId,
  });
  return res.deletedCount > 0;
};

/** External ids this user saved, newest first — merged into local state on load. */
export const listSavedIds = async (userId: string, source: string): Promise<number[]> => {
  const rows = await MemeSave.find({ user: userId, source }, { externalId: 1 })
    .sort({ createdAt: -1 })
    .lean<Array<{ externalId: number }>>();
  return rows.map((r) => r.externalId);
};
