import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import type { ChatSharedContent, GetChatMediaInput } from '../../types/chat.js';
import { AppError } from '../../utils/AppError.js';
import { extractUniqueLinks } from './shared.js';

export const getMedia = async (
  input: GetChatMediaInput
): Promise<ChatSharedContent> => {
  const { userId, chatId } = input;
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

  const attachments = messages.flatMap((msg) =>
    msg.attachments.map((att) => ({
      ...att,
      messageId: String(msg._id),
      senderId: String(msg.sender),
    }))
  );
  const links = extractUniqueLinks(textMessages);

  return { attachments, links };
};
