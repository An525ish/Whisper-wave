import type { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  ONLINE_USERS,
  REFETCH_CHATS,
  START_TYPING,
  STOP_TYPING,
  USER_OFFLINE,
  USER_ONLINE,
} from '../constants/socket-events.js';
import * as userRepo from '../repositories/user.js';
import {
  getMemberSockets,
  getOnlineUserIds,
  messageService,
  removeUserSocket,
  setUserSocket,
} from '../services/index.js';
import { logger } from '../utils/logger.js';

type NewMessagePayload = {
  message: string;
  members: string[];
  chatId: string;
  replyToMessageId?: string;
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

    socket.emit(ONLINE_USERS, { userIds: getOnlineUserIds() });
    socket.broadcast.emit(USER_ONLINE, { userId });

    socket.on(NEW_MESSAGE, async (payload: NewMessagePayload) => {
      try {
        const { message, members, chatId, replyToMessageId } = payload;

        if (!message?.trim() || !chatId || !Array.isArray(members)) {
          return;
        }

        const isMember = await messageService.assertChatMember(userId, chatId);
        if (!isMember) return;

        const replyTo = replyToMessageId
          ? await messageService.buildReplySnapshot(chatId, replyToMessageId)
          : undefined;

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
          replyTo: replyTo
            ? {
                messageId: String(replyTo.messageId),
                content: replyTo.content,
                senderName: replyTo.senderName,
                previewAttachment: replyTo.previewAttachment,
              }
            : undefined,
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
          replyToMessageId,
        });
      } catch (error) {
        logger.error({ err: error }, 'NEW_MESSAGE handler failed');
      }
    });

    socket.on(START_TYPING, ({ members, chatId }: TypingPayload) => {
      if (!chatId || !Array.isArray(members)) return;
      const memberSocketIds = getMemberSockets(members);
      socket.broadcast.to(memberSocketIds).emit(START_TYPING, { chatId });
    });

    socket.on(STOP_TYPING, ({ members, chatId }: TypingPayload) => {
      if (!chatId || !Array.isArray(members)) return;
      const memberSocketIds = getMemberSockets(members);
      socket.broadcast.to(memberSocketIds).emit(STOP_TYPING, { chatId });
    });

    socket.on('disconnect', () => {
      removeUserSocket(userId);
      void (async () => {
        try {
          const lastSeen = await userRepo.updateLastSeen(userId);
          socket.broadcast.emit(USER_OFFLINE, {
            userId,
            lastSeen: lastSeen.toISOString(),
          });
        } catch (error) {
          socket.broadcast.emit(USER_OFFLINE, { userId });
          logger.error({ err: error, userId }, 'Failed to persist lastSeen');
        }
      })();
      logger.debug({ userId, socketId: socket.id }, 'User disconnected');
    });
  });
};
