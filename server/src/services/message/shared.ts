import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import * as userRepo from '../../repositories/user.js';
import type { LastMessageType } from '../../types/index.js';
import type { MessageForClient, MessageRecord, MessageReplyTo, MessageReplyToClient } from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';

export const MESSAGE_PAGE_SIZE = 20;

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

export const serializeReplyToClient = (
  replyTo?: MessageReplyTo
): MessageReplyToClient | undefined => {
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

export const formatMessageForClient = async (
  message: MessageRecord
): Promise<MessageForClient> => {
  const senderDoc = await userRepo.findByIdNameAvatar(String(message.sender));

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

export const syncChatLastMessage = async (chatId: string): Promise<void> => {
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

export const getChatMembersOrThrow = async (userId: string, chatId: string) => {
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

export const assertChatMember = async (
  userId: string,
  chatId: string
): Promise<boolean> => {
  const chat = await chatRepo.findByIdMembers(chatId);
  if (!chat) return false;
  return chat.members.some((member) => member.toString() === userId);
};
