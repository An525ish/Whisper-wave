import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import type {
  GetMessageContextInput,
  GetMessageContextResult,
  GetMessagesInput,
  GetMessagesResult,
  MessageListItem,
  MessagePopulatedSender,
} from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';
import { MESSAGE_PAGE_SIZE } from './shared.js';

export const getMessages = async (
  input: GetMessagesInput
): Promise<GetMessagesResult> => {
  const { userId, chatId, page } = input;
  const skip = (page - 1) * MESSAGE_PAGE_SIZE;

  const [chat, messages, totalMessages] = await Promise.all([
    chatRepo.findByIdLean(chatId),
    messageRepo.findByChatPage(chatId, skip, MESSAGE_PAGE_SIZE),
    messageRepo.countByChat(chatId),
  ]);

  if (!chat) throw new AppError(400, 'No chat found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  type PopulatedChat = { _id: { toString(): string }; groupChat?: boolean };

  const data: MessageListItem[] = [...messages].reverse().map((message) => {
    const sender = message.sender as unknown as MessagePopulatedSender;
    const populatedChat = message.chat as unknown as PopulatedChat;
    const avatar =
      typeof sender.avatar === 'string'
        ? sender.avatar
        : sender.avatar?.url || '';

    return {
      ...message,
      chat: String(populatedChat._id),
      sender: {
        _id: String(sender._id),
        name: sender.name || 'Unknown',
        avatar,
      },
    };
  });

  return {
    groupChat: chat.groupChat,
    data,
    totalPages: Math.ceil(totalMessages / MESSAGE_PAGE_SIZE) || 0,
  };
};

export const getMessageContext = async (
  input: GetMessageContextInput
): Promise<GetMessageContextResult> => {
  const { userId, chatId, messageId } = input;
  const msg = await messageRepo.findByIdLean(messageId);
  if (!msg || msg.chat.toString() !== chatId) {
    throw new AppError(404, 'Message not found');
  }

  const [newerCount] = await Promise.all([
    messageRepo.countNewerThan(chatId, msg.createdAt),
    messageRepo.countByChat(chatId),
  ]);

  const page = Math.floor(newerCount / MESSAGE_PAGE_SIZE) + 1;
  const result = await getMessages({ userId, chatId, page });
  return { data: result.data, page, totalPages: result.totalPages };
};
