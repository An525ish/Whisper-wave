import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import type { AdminMessagesPage } from '../../types/admin.js';
import { AppError } from '../../utils/AppError.js';
import { trimOptional } from '../../utils/normalize.js';
import type { AdminMessagesQuery } from '../../validators/admin.js';
import { parseBeforeCursor } from './shared.js';

export const listMessages = async (input: AdminMessagesQuery): Promise<AdminMessagesPage> => {
  const before = parseBeforeCursor(input.before);
  const limit = input.limit;
  const fetchLimit = limit + 1;
  const status = input.status;
  const q = trimOptional(input.q);
  const senderId = input.senderId || undefined;
  const isFirstPage = !before;

  const [rows, total] = await Promise.all([
    messageRepo.listForAdminPage({ limit: fetchLimit, before, status, q, senderId }),
    isFirstPage ? messageRepo.countForAdmin({ status, q, senderId }) : Promise.resolve(undefined),
  ]);

  const messages = rows.slice(0, limit);
  const last = messages[messages.length - 1];
  const hasMore = rows.length > limit;

  return {
    messages,
    nextCursor:
      hasMore && last?.createdAt ? new Date(last.createdAt).toISOString() : null,
    hasMore,
    ...(total !== undefined ? { total } : {}),
  };
};

export const deleteMessage = async (id: string): Promise<void> => {
  const deleted = await messageRepo.deleteById(id);
  if (!deleted) throw new AppError(404, 'Message not found');
};

export const retryMessage = async (
  id: string,
  emitFn: (event: string, members: string[], data: unknown) => void,
): Promise<void> => {
  const msg = await messageRepo.findByIdLean(id);
  if (!msg) throw new AppError(404, 'Message not found');
  if (msg.status !== 'failed') throw new AppError(400, 'Message is not in failed state');

  const chat = await chatRepo.findByIdLean(msg.chat.toString());
  if (!chat) throw new AppError(404, 'Chat not found');

  const memberIds = chat.members.map((m) => m.toString());

  // Re-emit the message to all chat members and mark it as sent.
  emitFn('NEW_MESSAGE', memberIds, {
    chatId: msg.chat.toString(),
    message: {
      _id: String(msg._id),
      content: msg.content,
      sender: msg.sender,
      chat: msg.chat,
      createdAt: msg.createdAt,
    },
  });

  await messageRepo.updateById(id, { status: 'sent' } as Parameters<typeof messageRepo.updateById>[1]);
};
