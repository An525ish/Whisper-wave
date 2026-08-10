import {
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from '../constants/socket-events.js';
import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
import { User } from '../models/user.js';
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
    Chat.findById(chatId),
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .limit(resultPerPage)
      .skip(skip)
      .lean()
      .populate('sender', 'name avatar')
      .populate('chat', 'groupChat'),
    Message.countDocuments({ chat: chatId }),
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
    name: string;
    avatar: { url: string };
  };
  type PopulatedChat = { _id: { toString(): string }; groupChat?: boolean };

  const data = [...messages].reverse().map((message) => {
    const sender = message.sender as unknown as PopulatedSender;
    const populatedChat = message.chat as unknown as PopulatedChat;

    return {
      ...message,
      chat: populatedChat._id,
      sender: {
        ...sender,
        avatar: sender.avatar.url,
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
    User.findById(userId, 'name avatar'),
    Chat.findById(chatId),
  ]);

  if (!user || !chat) throw new AppError(400, 'No chat found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const message = await Message.create({
    content,
    attachments: [],
    sender: userId,
    chat: chatId,
  });

  try {
    const attachments = await uploadToCloudinary(files);
    message.attachments = attachments;
    await message.save();

    const lastAttachment = attachments.at(-1);
    const lastAttachmentType = lastAttachment?.fileType.split('/')[0];
    let lastMessageType: LastMessageType = 'document';
    let lastMessageContent = content || lastAttachment?.name || '';

    if (lastAttachmentType === 'media') {
      lastMessageType = 'media';
      lastMessageContent = lastAttachment?.name || '';
    }

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        _id: message._id,
        content: lastMessageContent,
        sender: userId,
        type: lastMessageType,
        createdAt: message.createdAt,
      },
    });

    return {
      data: {
        ...message.toObject(),
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
      message.status = 'failed';
      await message.save();
    } else {
      await message.deleteOne();
    }
    throw new AppError(500, 'Failed to upload attachments');
  }
};
