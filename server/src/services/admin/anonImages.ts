import { AnonImage } from '../../models/anonImage.js';
import { deleteManyFromR2 } from '../../utils/storage.js';

export const listAnonImages = async (limit: number, before?: string) => {
  const cursor = before ? new Date(before) : undefined;
  const rows = await AnonImage.find(cursor && !isNaN(+cursor) ? { createdAt: { $lt: cursor } } : {})
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .select('url sessionId source roomSlug createdAt')
    .lean();
  const items = rows.slice(0, limit);
  const last = items[items.length - 1];
  const hasMore = rows.length > limit;
  return {
    items,
    hasMore,
    nextCursor: hasMore && last?.createdAt ? last.createdAt.toISOString() : null,
  };
};

/** Delete from R2 first, then the rows, so a failed R2 call leaves the row to retry. */
export const deleteAnonImages = async (ids: string[]): Promise<void> => {
  const rows = await AnonImage.find({ _id: { $in: ids } }).select('key').lean();
  await deleteManyFromR2(rows.map((r) => r.key));
  await AnonImage.deleteMany({ _id: { $in: rows.map((r) => r._id) } });
};
