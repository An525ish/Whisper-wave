import {
  NEW_ATTACHMENT,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
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

    // Create the message in the database immediately
    const messageForDb = {
      content,
      attachments: [], // We'll update this later
      sender: userId,
      chat: chatId,
    };
    const message = await Message.create(messageForDb);

    // Start the upload process
    try {
      const attachments = await uploadToCloudinary(files);

      // Update the message with the attachment info
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

      // Emit the updated message to all chat members
      // emitEvent(req, NEW_MESSAGE, chat.members, {
      //   message: messageForRealTime,
      //   chatId,
      // });

      emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });
      emitEvent(req, NEW_ATTACHMENT, chat.members, { chatId });

      // Send a success response to the client
      res.status(200).json({
        status: true,
        message: 'Message sent successfully with attachments',
        data: messageForRealTime,
      });
    } catch (uploadError) {
      if (content) {
        // Update the message to indicate the upload failure
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
