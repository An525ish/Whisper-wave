import * as messageRepo from '../../repositories/message.js';
import type { AdminAttachmentsPage } from '../../types/admin.js';
import type { AdminAttachmentsQuery } from '../../validators/admin.js';
import { parseBeforeCursor } from './shared.js';

export const listAttachments = async (input: AdminAttachmentsQuery): Promise<AdminAttachmentsPage> => {
  const before = parseBeforeCursor(input.before);
  const limit = input.limit;
  const fetchLimit = limit + 1;
  const q = input.q?.trim() || undefined;
  const senderId = input.senderId || undefined;
  const kind = input.kind || 'all';
  const isFirstPage = !before;

  const [rows, total] = await Promise.all([
    messageRepo.listAttachmentsForAdmin({ limit: fetchLimit, before, q, senderId, kind }),
    isFirstPage ? messageRepo.countAttachmentsForAdmin({ q, senderId, kind }) : Promise.resolve(undefined),
  ]);

  const messages = rows.slice(0, limit);
  const last = messages[messages.length - 1];
  const hasMore = rows.length > limit;

  return {
    messages: messages as unknown as AdminAttachmentsPage['messages'],
    nextCursor: hasMore && last?.createdAt ? new Date(last.createdAt).toISOString() : null,
    hasMore,
    ...(total !== undefined ? { total } : {}),
  };
};
