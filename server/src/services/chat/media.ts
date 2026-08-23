import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import type { ChatSharedContent } from '../../types/chat.js';
import { AppError } from '../../utils/AppError.js';
import { extractUniqueLinks } from './shared.js';

export const getMedia = async (
  userId: string,
  chatId: string
): Promise<ChatSharedContent> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(400, 'No chat found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const [messages, textMessages] = await Promise.all([
    messageRepo.findAttachmentsByChat(chatId),
    messageRepo.findTextContentsByChat(chatId),
  ]);

  const attachments = messages.flatMap((msg) => msg.attachments);
  const links = extractUniqueLinks(textMessages);

  return { attachments, links };
};
