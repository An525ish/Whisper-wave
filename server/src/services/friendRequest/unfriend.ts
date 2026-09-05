import * as chatRepo from '../../repositories/chat.js';
import * as chatReadRepo from '../../repositories/chatRead.js';
import * as messageRepo from '../../repositories/message.js';
import { REFETCH_CHATS } from '../../constants/socket-events.js';
import { AppError } from '../../utils/AppError.js';
import type { ChatMutationMessageResult } from '../../types/chat.js';

export const unfriend = async (
  userId: string,
  chatId: string,
): Promise<ChatMutationMessageResult> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  if (chat.groupChat) throw new AppError(400, 'Cannot unfriend from a group chat');
  const isMember = chat.members.some((m) => m.toString() === userId);
  if (!isMember) throw new AppError(403, 'Forbidden');

  const memberIds = chat.members.map(String);

  await Promise.all([
    chatRepo.deleteById(chatId),
    messageRepo.deleteByChatId(chatId),
    chatReadRepo.deleteByChatId(chatId),
  ]);

  return {
    message: 'Unfriended successfully',
    memberIds,
    notifications: [{ event: REFETCH_CHATS, chatId, data: { chatId } }],
  };
};
