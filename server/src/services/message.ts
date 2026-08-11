import {
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from '../constants/socket-events.js';
import * as chatRepo from '../repositories/chat.js';
import * as messageRepo from '../repositories/message.js';
import * as userRepo from '../repositories/user.js';
import type {
  LastMessageType,
  MessageListItem,
  RealtimeNotify,
  UploadableFile,
} from '../types/index.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const getMessages = async (
  userId: string,
  chatId: string,
  page: number
): Promise<{
  groupChat: boolean;
  data: MessageListItem[];
  totalPages: number;
}> => {
  const resultPerPage = 20;
  const skip = (page - 1) * resultPerPage;

  const [chat, messages, totalMessages] = await Promise.all([
    chatRepo.findByIdLean(chatId),
    messageRepo.findByChatPage(chatId, skip, resultPerPage),
    messageRepo.countByChat(chatId),
  ]);

  if (!chat) throw new AppError(400, 'No chat found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  type PopulatedSender = {
    _id: unknown;
    name?: string;
    avatar?: string | { url?: string };
  };
  type PopulatedChat = { _id: { toString(): string }; groupChat?: boolean };

  const data = [...messages].reverse().map((message) => {
    const sender = message.sender as unknown as PopulatedSender;
    const populatedChat = message.chat as unknown as PopulatedChat;
    const avatar =
      typeof sender.avatar === 'string'
        ? sender.avatar
        : sender.avatar?.url;

    return {
      ...message,
      chat: populatedChat._id,
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
    totalPages: Math.ceil(totalMessages / resultPerPage) || 0,
  };
};

export const sendAttachments = async (
  userId: string,
  chatId: string,
  files: UploadableFile[],
  content?: string
): Promise<{ data: unknown; notifications: RealtimeNotify[] }> => {
  if (files.length === 0) {
    throw new AppError(400, 'Send at least one file');
  }

  const [user, chat] = await Promise.all([
    userRepo.findByIdNameAvatar(userId),
    chatRepo.findByIdLean(chatId),
  ]);

  if (!user || !chat) throw new AppError(400, 'No chat found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const message = await messageRepo.create({
    content,
    attachments: [],
    sender: userId,
    chat: chatId,
  });

  try {
    const attachments = await uploadToCloudinary(files);
    const saved = await messageRepo.updateById(message._id, { attachments });

    const lastAttachment = attachments.at(-1);
    const lastAttachmentType = lastAttachment?.fileType.split('/')[0];
    let lastMessageType: LastMessageType = 'document';
    let lastMessageContent = content || lastAttachment?.name || '';

    if (lastAttachmentType === 'media') {
      lastMessageType = 'media';
      lastMessageContent = lastAttachment?.name || '';
    }

    await chatRepo.updateLastMessage(chatId, {
      _id: message._id,
      content: lastMessageContent,
      sender: user._id,
      type: lastMessageType,
      createdAt: message.createdAt,
    });

    return {
      data: {
        ...(saved ?? message),
        sender: {
          _id: userId,
          name: user.name,
          avatar: user.avatar.url,
        },
      },
      notifications: [
        { event: NEW_MESSAGE_ALERT, members: chat.members, data: { chatId } },
        { event: NEW_ATTACHMENT, members: chat.members, data: { chatId } },
        { event: REFETCH_CHATS, members: chat.members, data: { chatId } },
      ],
    };
  } catch {
    if (content) {
      await messageRepo.updateById(message._id, { status: 'failed' });
    } else {
      await messageRepo.deleteById(message._id);
    }
    throw new AppError(500, 'Failed to upload attachments');
  }
};

/** Persist a realtime text message after membership is validated. */
export const persistTextMessage = async (input: {
  userId: string;
  chatId: string;
  content: string;
}): Promise<{ ok: true } | { ok: false }> => {
  const chat = await chatRepo.findByIdMembers(input.chatId);
  if (!chat) return { ok: false };

  const isMember = chat.members.some(
    (member) => member.toString() === input.userId
  );
  if (!isMember) return { ok: false };

  const newMessage = await messageRepo.create({
    content: input.content,
    chat: input.chatId,
    sender: input.userId,
  });

  await chatRepo.updateLastMessage(input.chatId, {
    _id: newMessage._id,
    content: input.content,
    sender: newMessage.sender,
    type: 'text',
    createdAt: newMessage.createdAt,
  });

  return { ok: true };
};

export const assertChatMember = async (
  userId: string,
  chatId: string
): Promise<boolean> => {
  const chat = await chatRepo.findByIdMembers(chatId);
  if (!chat) return false;
  return chat.members.some((member) => member.toString() === userId);
};
