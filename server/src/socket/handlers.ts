import type { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
  START_TYPING,
  STOP_TYPING,
} from '../constants/socket-events.js';
import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
import {
  getMemberSockets,
  removeUserSocket,
  setUserSocket,
} from '../services/index.js';
import { logger } from '../utils/logger.js';

type NewMessagePayload = {
  message: string;
  members: string[];
  chatId: string;
};

type TypingPayload = {
  members: string[];
  chatId: string;
};

export const registerSocketHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    const user = socket.user;

    if (!user) {
      socket.disconnect(true);
      return;
    }

    const userId = user._id.toString();
    setUserSocket(userId, socket.id);
    logger.debug({ userId, socketId: socket.id }, 'User connected');

    socket.on(NEW_MESSAGE, async (payload: NewMessagePayload) => {
      try {
        const { message, members, chatId } = payload;

        if (!message?.trim() || !chatId || !Array.isArray(members)) {
          return;
        }

        const chat = await Chat.findById(chatId).select('members');
        if (!chat) return;

        const isMember = chat.members.some(
          (member) => member.toString() === userId
        );
        if (!isMember) return;

        const realTimeMsg = {
          content: message,
          _id: uuid(),
          sender: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar.url,
          },
          chat: chatId,
          createdAt: new Date().toISOString(),
        };

        const memberSocketIds = getMemberSockets(members);

        io.to(memberSocketIds).emit(NEW_MESSAGE, {
          chatId,
          message: realTimeMsg,
        });

        socket.broadcast
          .to(memberSocketIds)
          .emit(NEW_MESSAGE_ALERT, { chatId });
        io.to(memberSocketIds).emit(REFETCH_CHATS, { chatId });

        const newMessage = await Message.create({
          content: message,
          chat: chatId,
          sender: user._id,
        });

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: {
            _id: newMessage._id,
            content: message,
            sender: user._id,
            type: 'text',
            createdAt: newMessage.createdAt,
          },
        });
      } catch (error) {
        logger.error({ err: error }, 'NEW_MESSAGE handler failed');
      }
    });

    socket.on(START_TYPING, ({ members, chatId }: TypingPayload) => {
      const memberSocketIds = getMemberSockets(members);
      socket.broadcast.to(memberSocketIds).emit(START_TYPING, { chatId });
    });

    socket.on(STOP_TYPING, ({ members, chatId }: TypingPayload) => {
      const memberSocketIds = getMemberSockets(members);
      socket.broadcast.to(memberSocketIds).emit(STOP_TYPING, { chatId });
    });

    socket.on('disconnect', () => {
      removeUserSocket(userId);
      logger.debug({ userId, socketId: socket.id }, 'User disconnected');
    });
  });
};
