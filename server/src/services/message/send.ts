import {
  NEW_ATTACHMENT,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from '../../constants/socket-events.js';
import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import * as userRepo from '../../repositories/user.js';
import type { LastMessageType } from '../../types/index.js';
import type {
  PersistTextMessageInput,
  PersistTextMessageResult,
  SendAttachmentsInput,
  SendGifInput,
  SendMessageResult,
} from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';
import * as uploadService from '../upload/index.js';
import { buildReplySnapshot, formatMessageForClient } from './shared.js';

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

export const sendAttachments = async (
  input: SendAttachmentsInput,
): Promise<SendMessageResult> => {
  const { userId, chatId, attachments: rawAttachments, content, replyToMessageId } = input;

  if (rawAttachments.length === 0) {
    throw new AppError(400, 'Send at least one attachment');
  }

  // Verify chat membership and fetch user in parallel.
  // uploadService.verifyAndNormalizeAttachment also checks membership per attachment,
  // but we short-circuit here to avoid unnecessary R2 HeadObject calls for non-members.
  const [user, chat] = await Promise.all([
    userRepo.findByIdNameAvatar(userId),
    chatRepo.findByIdLean(chatId),
  ]);

  if (!user || !chat) throw new AppError(400, 'No chat found');

  const isMember = chat.members.some((m) => m.toString() === userId.toString());
  if (!isMember) throw new AppError(403, 'Not a member of this chat');

  const replyTo = replyToMessageId
    ? await buildReplySnapshot(chatId, replyToMessageId)
    : undefined;

  // Verify all attachments in R2 (HeadObject per file) before touching the DB.
  // This ensures no message is created with unresolvable or spoofed attachment keys.
  const verifiedAttachments = await Promise.all(
    rawAttachments.map((a) =>
      uploadService.verifyAndNormalizeAttachment(a, userId, chatId),
    ),
  );

  // Create the message in a single shot — no stub, no partial state.
  const message = await messageRepo.create({
    content,
    attachments: verifiedAttachments,
    sender: userId,
    chat: chatId,
    replyTo,
  });

  const lastAttachment = verifiedAttachments.at(-1);
  const lastMessageType: LastMessageType = lastAttachment?.fileType === 'media' ? 'media' : 'document';
  const lastMessageContent = content || lastAttachment?.name || '';

  await chatRepo.updateLastMessage(chatId, {
    _id: message._id,
    content: lastMessageContent,
    sender: user._id,
    type: lastMessageType,
    createdAt: message.createdAt,
  });

  const formatted = await formatMessageForClient(message);

  return {
    data: {
      ...message,
      sender: { _id: userId, name: user.name, avatar: user.avatar.url },
    },
    notifications: [
      { event: NEW_MESSAGE, chatId, data: { chatId, message: formatted } },
      { event: NEW_MESSAGE_ALERT, chatId, excludeUserId: userId, data: { chatId } },
      { event: NEW_ATTACHMENT, chatId, data: { chatId } },
      { event: REFETCH_CHATS, chatId, excludeUserId: userId, data: { chatId } },
    ],
  };
};

export const sendGif = async (input: SendGifInput): Promise<SendMessageResult> => {
  const {
    userId, chatId, gifId, gifUrl, gifTitle, replyToMessageId, mimeType, kind = 'gif'
  } = input;

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

  const formatted = await formatMessageForClient(message);

  return {
    data: {
      ...message,
      sender: { _id: userId, name: user.name, avatar: user.avatar.url },
    },
    notifications: [
      { event: NEW_MESSAGE, chatId, data: { chatId, message: formatted } },
      { event: NEW_MESSAGE_ALERT, chatId, excludeUserId: userId, data: { chatId } },
      { event: NEW_ATTACHMENT, chatId, data: { chatId } },
      { event: REFETCH_CHATS, chatId, data: { chatId } },
    ],
  };
};

/** Persist a realtime text message after membership is validated.
 *  Returns the canonical DB members list so the socket handler never
 *  fans-out based on a client-supplied (potentially spoofed) array. 
 */
export const persistTextMessage = async (
  input: PersistTextMessageInput
): Promise<PersistTextMessageResult> => {
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
    replyTo,
  };
};
