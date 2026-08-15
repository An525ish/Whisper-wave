import {
  CHAT_CLEARED,
  MESSAGE_UPDATED,
  MESSAGES_DELETED,
  NEW_ATTACHMENT,
  NEW_MESSAGE,
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
import type { MessageRecord, MessageReplyTo } from '../types/message.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import {
  assertCreator,
  canDeleteMessage,
  isGroupModerator,
} from '../utils/groupRole.js';

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
  content?: string,
  replyToMessageId?: string
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

  const replyTo = replyToMessageId
    ? await buildReplySnapshot(chatId, replyToMessageId)
    : undefined;

  const message = await messageRepo.create({
    content,
    attachments: [],
    sender: userId,
    chat: chatId,
    replyTo,
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

const mimeFromKlipyUrl = (url: string, fallback = 'image/gif') => {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.webp')) return 'image/webp';
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
    if (path.endsWith('.gif')) return 'image/gif';
  } catch {
    /* ignore */
  }
  return fallback;
};

export const sendGif = async (
  userId: string,
  chatId: string,
  gifId: string,
  gifUrl: string,
  gifTitle: string,
  replyToMessageId?: string,
  mimeType?: string,
  kind: 'gif' | 'meme' = 'gif'
): Promise<{ data: unknown; notifications: RealtimeNotify[] }> => {
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

  const replyTo = replyToMessageId
    ? await buildReplySnapshot(chatId, replyToMessageId)
    : undefined;

  const fileType = mimeType || mimeFromKlipyUrl(gifUrl);
  const ext = fileType.split('/')[1] || 'gif';
  const label = kind === 'meme' ? 'Meme' : 'GIF';

  const attachment = {
    publicId: gifId,
    url: gifUrl,
    name: gifTitle || `${label.toLowerCase()}.${ext}`,
    fileType,
  };

  const message = await messageRepo.create({
    attachments: [attachment],
    sender: userId,
    chat: chatId,
    replyTo,
  });

  await chatRepo.updateLastMessage(chatId, {
    _id: message._id,
    content: label,
    sender: user._id,
    type: 'media',
    createdAt: message.createdAt,
  });

  return {
    data: {
      ...message,
      sender: { _id: userId, name: user.name, avatar: user.avatar.url },
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
};

/** Persist a realtime text message after membership is validated.
 *  Returns the canonical DB members list so the socket handler never
 *  fans-out based on a client-supplied (potentially spoofed) array. */
export const persistTextMessage = async (input: {
  userId: string;
  chatId: string;
  content: string;
  replyToMessageId?: string;
}): Promise<
  | {
      ok: true;
      messageId: string;
      createdAt: string;
      memberIds: string[];
      replyTo?: MessageReplyTo;
    }
  | { ok: false }
> => {
  const chat = await chatRepo.findByIdMembers(input.chatId);
  if (!chat) return { ok: false };

  const isMember = chat.members.some(
    (member) => member.toString() === input.userId
  );
  if (!isMember) return { ok: false };

  const replyTo = input.replyToMessageId
    ? await buildReplySnapshot(input.chatId, input.replyToMessageId)
    : undefined;

  const newMessage = await messageRepo.create({
    content: input.content,
    chat: input.chatId,
    sender: input.userId,
    replyTo,
  });

  await chatRepo.updateLastMessage(input.chatId, {
    _id: newMessage._id,
    content: input.content,
    sender: newMessage.sender,
    type: 'text',
    createdAt: newMessage.createdAt,
  });

  return {
    ok: true,
    messageId: String(newMessage._id),
    createdAt: new Date(newMessage.createdAt).toISOString(),
    memberIds: chat.members.map((m) => m.toString()),
    replyTo,
  };
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

type PopulatedSender = {
  _id: unknown;
  name?: string;
  avatar?: string | { url?: string };
};

const mapSenderAvatar = (sender: PopulatedSender) => {
  const avatar =
    typeof sender.avatar === 'string'
      ? sender.avatar
      : sender.avatar?.url || '';

  return {
    _id: String(sender._id),
    name: sender.name || 'Unknown',
    avatar,
  };
};

const serializeReplyToClient = (replyTo?: MessageReplyTo) => {
  if (!replyTo) return undefined;

  return {
    messageId: String(replyTo.messageId),
    content: replyTo.content,
    senderName: replyTo.senderName,
    previewAttachment: replyTo.previewAttachment,
  };
};

export const buildReplySnapshot = async (
  chatId: string,
  replyToMessageId: string
): Promise<MessageReplyTo | undefined> => {
  if (!replyToMessageId) return undefined;

  const original = await messageRepo.findByIdLean(replyToMessageId);
  if (
    !original ||
    original.chat.toString() !== chatId ||
    original.isDeleted
  ) {
    return undefined;
  }

  const senderDoc = await userRepo.findByIdNameAvatar(String(original.sender));
  const firstAttachment = original.attachments?.[0];

  return {
    messageId: original._id,
    content: original.content,
    senderName: senderDoc?.name ?? 'Unknown',
    previewAttachment: firstAttachment
      ? {
          url: firstAttachment.url,
          name: firstAttachment.name,
          fileType: firstAttachment.fileType,
        }
      : undefined,
  };
};

const formatMessageForClient = async (
  message: MessageRecord
): Promise<{
  _id: string;
  content?: string;
  attachments: MessageRecord['attachments'];
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  editedAt?: string;
  replyTo?: ReturnType<typeof serializeReplyToClient>;
  sender: { _id: string; name: string; avatar: string };
  readBy: string[];
}> => {
  const populated = await messageRepo.findByIdLean(String(message._id));
  const senderDoc = populated
    ? await userRepo.findByIdNameAvatar(String(message.sender))
    : null;

  return {
    _id: String(message._id),
    content: message.isDeleted ? undefined : message.content,
    attachments: message.isDeleted ? [] : (message.attachments ?? []),
    createdAt: new Date(message.createdAt).toISOString(),
    updatedAt: new Date(message.updatedAt).toISOString(),
    isDeleted: Boolean(message.isDeleted),
    editedAt: message.editedAt
      ? new Date(message.editedAt).toISOString()
      : undefined,
    replyTo: serializeReplyToClient(message.replyTo),
    sender: senderDoc
      ? {
          _id: String(senderDoc._id),
          name: senderDoc.name,
          avatar: senderDoc.avatar.url,
        }
      : mapSenderAvatar({ _id: message.sender, name: 'Unknown' }),
    readBy: (message.readBy ?? []).map(String),
  };
};

const syncChatLastMessage = async (chatId: string): Promise<void> => {
  const latest = await messageRepo.findLatestInChat(chatId);
  if (!latest) {
    await chatRepo.clearLastMessage(chatId);
    return;
  }

  const hasAttachments = (latest.attachments?.length ?? 0) > 0;
  const lastAttachment = latest.attachments?.at(-1);
  const lastAttachmentType = lastAttachment?.fileType.split('/')[0];

  let lastMessageType: LastMessageType = 'text';
  let lastMessageContent = latest.content || '';

  if (hasAttachments) {
    lastMessageType =
      lastAttachmentType === 'media' ? 'media' : 'document';
    lastMessageContent =
      latest.content || lastAttachment?.name || 'Attachment';
  }

  await chatRepo.updateLastMessage(chatId, {
    _id: latest._id,
    content: lastMessageContent,
    sender: latest.sender,
    type: lastMessageType,
    createdAt: latest.createdAt,
  });
};

const getChatMembersOrThrow = async (userId: string, chatId: string) => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'No chat found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  return chat;
};

export const editMessage = async (
  userId: string,
  messageId: string,
  content: string
): Promise<{ data: Awaited<ReturnType<typeof formatMessageForClient>>; notifications: RealtimeNotify[] }> => {
  const trimmed = content.trim();
  if (!trimmed) throw new AppError(400, 'Message cannot be empty');

  const existing = await messageRepo.findByIdLean(messageId);
  if (!existing || existing.isDeleted) {
    throw new AppError(404, 'Message not found');
  }

  if (existing.sender.toString() !== userId.toString()) {
    throw new AppError(403, 'You can only edit your own messages');
  }

  if ((existing.attachments?.length ?? 0) > 0) {
    throw new AppError(400, 'Only text messages can be edited');
  }

  const updated = await messageRepo.updateById(messageId, {
    content: trimmed,
    editedAt: new Date(),
  });
  if (!updated) throw new AppError(404, 'Message not found');

  const chatId = existing.chat.toString();
  const latest = await messageRepo.findLatestInChat(chatId);
  if (latest && latest._id.toString() === messageId) {
    await chatRepo.updateLastMessage(chatId, {
      _id: updated._id,
      content: trimmed,
      sender: updated.sender,
      type: 'text',
      createdAt: updated.createdAt,
    });
  }

  const chat = await chatRepo.findByIdMembers(chatId);
  const data = await formatMessageForClient(updated);

  return {
    data,
    notifications: [
      {
        event: MESSAGE_UPDATED,
        members: chat?.members ?? [],
        data: { chatId, message: data },
      },
      { event: REFETCH_CHATS, members: chat?.members ?? [], data: { chatId } },
    ],
  };
};

export const deleteMessage = async (
  userId: string,
  messageId: string
): Promise<{ messageIds: string[]; notifications: RealtimeNotify[] }> => {
  const existing = await messageRepo.findByIdLean(messageId);
  if (!existing || existing.isDeleted) {
    throw new AppError(404, 'Message not found');
  }

  const chat = await chatRepo.findByIdLean(existing.chat.toString());
  if (!chat) throw new AppError(404, 'Chat not found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  if (!canDeleteMessage(userId, chat, existing.sender.toString())) {
    throw new AppError(403, 'You can only delete your own messages');
  }

  const deleted = await messageRepo.softDeleteById(messageId);
  if (!deleted) throw new AppError(404, 'Message not found');

  const chatId = existing.chat.toString();
  await syncChatLastMessage(chatId);

  const messageIds = [messageId];

  return {
    messageIds,
    notifications: [
      {
        event: MESSAGES_DELETED,
        members: chat.members,
        data: { chatId, messageIds },
      },
      { event: REFETCH_CHATS, members: chat.members, data: { chatId } },
    ],
  };
};

export const deleteManyMessages = async (
  userId: string,
  chatId: string,
  messageIds: string[]
): Promise<{ messageIds: string[]; notifications: RealtimeNotify[] }> => {
  const chat = await getChatMembersOrThrow(userId, chatId);
  const canModerate =
    Boolean(chat.groupChat) && isGroupModerator(userId, chat);

  const deletedIds = await messageRepo.softDeleteManyByIds(messageIds, {
    chatId,
    ...(canModerate ? {} : { senderId: userId }),
  });
  if (deletedIds.length === 0) {
    throw new AppError(400, 'No messages could be deleted');
  }

  await syncChatLastMessage(chatId);

  return {
    messageIds: deletedIds,
    notifications: [
      {
        event: MESSAGES_DELETED,
        members: chat.members,
        data: { chatId, messageIds: deletedIds },
      },
      { event: REFETCH_CHATS, members: chat.members, data: { chatId } },
    ],
  };
};

export const clearChatMessages = async (
  userId: string,
  chatId: string
): Promise<{ notifications: RealtimeNotify[] }> => {
  const chat = await getChatMembersOrThrow(userId, chatId);

  if (chat.groupChat) {
    assertCreator(userId, chat);
  }

  await messageRepo.deleteByChatId(chatId);
  await chatRepo.clearLastMessage(chatId);

  return {
    notifications: [
      {
        event: CHAT_CLEARED,
        members: chat.members,
        data: { chatId },
      },
      { event: REFETCH_CHATS, members: chat.members, data: { chatId } },
    ],
  };
};

export const forwardMessages = async (
  userId: string,
  sourceChatId: string,
  targetChatId: string,
  messageIds: string[]
): Promise<{ notifications: RealtimeNotify[] }> => {
  if (sourceChatId === targetChatId) {
    throw new AppError(400, 'Cannot forward to the same chat');
  }

  await getChatMembersOrThrow(userId, sourceChatId);
  const targetChat = await getChatMembersOrThrow(userId, targetChatId);

  const messages = await messageRepo.findByIdsInChat(sourceChatId, messageIds);
  if (messages.length === 0) {
    throw new AppError(400, 'No messages to forward');
  }

  const createdMessages: MessageRecord[] = [];

  for (const msg of messages) {
    const created = await messageRepo.create({
      content: msg.content,
      attachments: [...(msg.attachments ?? [])],
      sender: userId,
      chat: targetChatId,
    });
    createdMessages.push(created);
  }

  const lastCreated = createdMessages[createdMessages.length - 1];
  const hasAttachments = (lastCreated.attachments?.length ?? 0) > 0;
  const lastAttachment = lastCreated.attachments?.at(-1);
  const lastAttachmentType = lastAttachment?.fileType.split('/')[0];

  let lastMessageType: LastMessageType = 'text';
  let lastMessageContent = lastCreated.content || '';

  if (hasAttachments) {
    lastMessageType =
      lastAttachmentType === 'media' ? 'media' : 'document';
    lastMessageContent =
      lastCreated.content || lastAttachment?.name || 'Attachment';
  }

  await chatRepo.updateLastMessage(targetChatId, {
    _id: lastCreated._id,
    content: lastMessageContent,
    sender: lastCreated.sender,
    type: lastMessageType,
    createdAt: lastCreated.createdAt,
  });

  const notifications: RealtimeNotify[] = [];

  for (const created of createdMessages) {
    const formatted = await formatMessageForClient(created);
    notifications.push({
      event: NEW_MESSAGE,
      members: targetChat.members,
      data: { chatId: targetChatId, message: formatted },
    });
  }

  notifications.push({
    event: NEW_MESSAGE_ALERT,
    members: targetChat.members.filter((m) => m.toString() !== userId),
    data: { chatId: targetChatId },
  });
  notifications.push({
    event: REFETCH_CHATS,
    members: targetChat.members,
    data: { chatId: targetChatId },
  });

  return { notifications };
};
