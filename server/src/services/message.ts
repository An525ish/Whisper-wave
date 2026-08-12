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
        : sender.avatar?.url || '';

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
        {
          event: NEW_MESSAGE_ALERT,
          members: chat.members.filter((m) => m.toString() !== userId),
          data: { chatId },
        },
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

export const searchMessages = async (
  userId: string,
  chatId: string,
  query: string,
  options?: {
    scope?: 'all' | 'text' | 'media' | 'links';
    from?: 'anyone' | 'me' | 'others';
    senderId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }
): Promise<{
  data: Array<{
    _id: string;
    content?: string;
    attachments?: Array<{ name?: string; fileType?: string; url?: string }>;
    createdAt: string;
    sender: { _id: string; name: string; avatar: string };
  }>;
  total: number;
}> => {
  const isMember = await assertChatMember(userId, chatId);
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const trimmed = query.trim();
  const dateFrom = options?.dateFrom ? new Date(options.dateFrom) : undefined;
  const dateTo = options?.dateTo ? new Date(options.dateTo) : undefined;
  const validDateFrom =
    dateFrom && !Number.isNaN(dateFrom.getTime()) ? dateFrom : undefined;
  const validDateTo =
    dateTo && !Number.isNaN(dateTo.getTime()) ? dateTo : undefined;

  type PopulatedSender = {
    _id: unknown;
    name?: string;
    avatar?: string | { url?: string };
  };

  const mapRow = (message: {
    _id: { toString(): string };
    content?: string;
    attachments?: Array<{ name?: string; fileType?: string; url?: string }>;
    createdAt: Date;
    sender: unknown;
  }) => {
    const sender = message.sender as PopulatedSender;
    const avatar =
      typeof sender.avatar === 'string'
        ? sender.avatar
        : sender.avatar?.url || '';

    return {
      _id: String(message._id),
      content: message.content,
      attachments: (message.attachments ?? []).map((att) => ({
        name: att.name,
        fileType: att.fileType,
        url: att.url,
      })),
      createdAt: new Date(message.createdAt).toISOString(),
      sender: {
        _id: String(sender._id),
        name: sender.name || 'Unknown',
        avatar,
      },
    };
  };

  const rows = await messageRepo.searchInChat({
    chatId,
    query: trimmed,
    scope: options?.scope,
    senderId:
      options?.senderId ||
      (options?.from === 'me' ? userId : undefined),
    excludeSenderId: options?.from === 'others' ? userId : undefined,
    dateFrom: validDateFrom,
    dateTo: validDateTo,
    limit: options?.limit,
  });

  const data = rows.map(mapRow);
  return { data, total: data.length };
};

/** Resolve the first message on a calendar day — no list fetch, no fall-through. */
export const jumpToDate = async (
  userId: string,
  chatId: string,
  dateFromIso: string,
  dateToIso?: string
): Promise<{
  _id: string;
  createdAt: string;
  exactDay: boolean;
} | null> => {
  const isMember = await assertChatMember(userId, chatId);
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const dayStart = new Date(dateFromIso);
  if (Number.isNaN(dayStart.getTime())) {
    throw new AppError(400, 'Invalid date');
  }

  const dayEnd = dateToIso
    ? new Date(dateToIso)
    : new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  if (Number.isNaN(dayEnd.getTime())) {
    throw new AppError(400, 'Invalid date');
  }

  const target = await messageRepo.findJumpTargetForDay(
    chatId,
    dayStart,
    dayEnd
  );
  if (!target) return null;

  return {
    _id: String(target._id),
    createdAt: new Date(target.createdAt).toISOString(),
    exactDay: target.exactDay,
  };
};

/** Calendar days in range that have at least one message (local YYYY-MM-DD),
 *  plus `minYear` derived from the oldest message (O(1) index seek). */
export const listActiveDates = async (
  userId: string,
  chatId: string,
  dateFromIso: string,
  dateToIso: string,
  timeZone: string
): Promise<{ dates: string[]; minYear: number | null }> => {
  const isMember = await assertChatMember(userId, chatId);
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const from = new Date(dateFromIso);
  const to = new Date(dateToIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new AppError(400, 'Invalid date range');
  }

  const [dates, oldest] = await Promise.all([
    messageRepo.listActiveDatesInRange(chatId, from, to, timeZone || 'UTC'),
    messageRepo.findOldestMessage(chatId),
  ]);

  const minYear = oldest
    ? new Date(oldest.createdAt).getFullYear()
    : null;

  return { dates, minYear };
};
