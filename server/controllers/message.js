import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
import { User } from '../models/user.js';
import { errorHandler } from '../utils/errorHandler.js';

export const getMessages = async (req, res, next) => {
  const { chatId } = req.params;
  const { page = 1 } = req.query;

  const resultPerPage = 20;
  const skip = (page - 1) * resultPerPage;

  try {
    const [messages, totalMessages] = await Promise.all([
      Message.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .limit(resultPerPage)
        .skip(skip)
        .populate('sender', 'name avatar'),
      Message.countDocuments({ chat: chatId }),
    ]);

    if (!messages) return next(errorHandler(400, 'No chat found'));

    res.status(200).json({
      success: true,
      message: 'Messages fetched successfully',
      data: messages,
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
      User.findById(userId, 'name, avatar'),
      Chat.findById(chatId),
    ]);

    if (!chat) return next(errorHandler(400, 'No chat found'));

    const files = req.files || [];
    if (files.length === 0)
      return next(errorHandler(400, 'Send at least one file'));

    // will be uploaded from cloudinary
    const attachments = [];

    const messageForDb = {
      content,
      attachments,
      sender: userId,
      chat: chatId,
    };
    const messageForRealTime = {
      ...messageForDb,
      sender: {
        _id: userId,
        name: user.name,
        avatar: user.avatar.url,
      },
    };

    const message = await Message.create(messageForDb);

    res.status(200).json({
      status: true,
      message: 'Attachment sent successfully',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};
