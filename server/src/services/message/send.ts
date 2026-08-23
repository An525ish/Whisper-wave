import {
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from '../../constants/socket-events.js';
import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import * as userRepo from '../../repositories/user.js';
import type { LastMessageType, RealtimeNotify, UploadableFile } from '../../types/index.js';
import type { MessageReplyTo } from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import { buildReplySnapshot } from './shared.js';

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
