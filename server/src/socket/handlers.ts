import type { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
  START_TYPING,
  STOP_TYPING,
} from '../constants/socket-events.js';
import {
  getMemberSockets,
  messageService,
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

        const isMember = await messageService.assertChatMember(userId, chatId);
        if (!isMember) return;

        const realTimeMsg = {
          content: message,
          _id: uuid(),
          sender: {
            _id: userId,
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

        await messageService.persistTextMessage({
          userId,
          chatId,
          content: message,
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
