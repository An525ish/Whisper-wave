import {
  CHAT_CLEARED,
  MESSAGE_UPDATED,
  MESSAGES_DELETED,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from '../../constants/socket-events.js';
import { MESSAGE_EDIT_WINDOW_MS } from '../../constants/chat.js';
import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import type { LastMessageType, RealtimeNotify } from '../../types/index.js';
import type { MessageRecord } from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';
import {
  assertCreator,
  canDeleteMessage,
  isGroupModerator,
} from '../../utils/groupRole.js';
import {
  formatMessageForClient,
  getChatMembersOrThrow,
  syncChatLastMessage,
} from './shared.js';

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

  const ageMs = Date.now() - new Date(existing.createdAt).getTime();
  if (ageMs > MESSAGE_EDIT_WINDOW_MS) {
    throw new AppError(400, 'Messages can only be edited within 15 minutes of sending');
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
