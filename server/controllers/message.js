import {
  NEW_ATTACHMENT,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from '../constants/socket-events.js';
import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
import { User } from '../models/user.js';
import { errorHandler } from '../utils/errorHandler.js';
import { emitEvent, uploadToCloudinary } from '../utils/services.js';

export const getMessages = async (req, res, next) => {
  const { chatId } = req.params;
  const { page = 1 } = req.query;

  const resultPerPage = 20;
  const skip = (page - 1) * resultPerPage;

  try {
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

    if (!chat || !messages) return next(errorHandler(400, 'No chat found'));

    const customMessages = messages
      .reverse()
      .map(({ sender, chat, ...rest }) => ({
        ...rest,
        chat: chat._id,
        sender: {
          ...sender,
          avatar: sender.avatar.url,
        },
      }));

    res.status(200).json({
      success: true,
      groupChat: chat.groupChat,
      data: customMessages,
      totalPages: Math.ceil(totalMessages / resultPerPage) || 0,
    });
  } catch (error) {
    next(error);
  }
};

export const sendAttachments = async (req, res, next) => {
  const userId = req.userId;
  const { chatId, content } = req.body;

  try {
    const [user, chat] = await Promise.all([
      User.findById(userId, 'name avatar'),
      Chat.findById(chatId),
    ]);

    if (!chat) return next(errorHandler(400, 'No chat found'));

    const files = req.files || [];
    if (files.length === 0)
      return next(errorHandler(400, 'Send at least one file'));

    const messageForDb = {
      content,
      attachments: [],
      sender: userId,
      chat: chatId,
    };
    const message = await Message.create(messageForDb);

    try {
      const attachments = await uploadToCloudinary(files);
      message.attachments = attachments;
      await message.save();

      const messageForRealTime = {
        ...message.toObject(),
        sender: {
          _id: userId,
          name: user.name,
          avatar: user.avatar.url,
        },
      };

      // Determine the type of the first attachment
      const lastAttachment = attachments?.[attachments.length - 1];
      const lastAttachmentType = lastAttachment?.fileType.split('/')[0];
      let lastMessageType = 'text';
      let lastMessageContent = content || '';

      switch (lastAttachmentType) {
        case 'media':
          lastMessageType = 'media';
          lastMessageContent = lastAttachment.name;
          break;
        case 'document':
          lastMessageType = 'document';
          lastMessageContent = lastAttachment.name;
          break;
        default:
          lastMessageType = 'document';
          lastMessageContent = lastAttachment.name;
      }

      // Update the chat's lastMessage
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: {
          _id: message._id,
          content: lastMessageContent,
          sender: userId,
          type: lastMessageType,
          createdAt: message.createdAt,
        },
      });

      emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });
      emitEvent(req, NEW_ATTACHMENT, chat.members, { chatId });
      emitEvent(req, REFETCH_CHATS, chat.members, { chatId });

      res.status(200).json({
        status: true,
        message: 'Message sent successfully with attachments',
        data: messageForRealTime,
      });
    } catch (uploadError) {
      if (content) {
        message.status = 'failed';
        await message.save();
      } else {
        await message.deleteOne();
      }

      return next(errorHandler(500, 'Failed to upload attachments'));
    }
  } catch (error) {
    next(error);
  }
};
