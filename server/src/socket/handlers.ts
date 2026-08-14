import type { Server, Socket } from 'socket.io';
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
  /** Client-provided for typing fan-out only — never trusted for message delivery. */
  members: string[];
  chatId: string;
  replyToMessageId?: string;
};

type TypingPayload = {
  members: string[];
  chatId: string;
};

/** Simple per-socket sliding-window rate limiter. */
const makeSocketRateLimiter = (maxEvents: number, windowMs: number) => {
  const timestamps = new Map<string, number[]>();
  return {
    allow(socketId: string): boolean {
      const now = Date.now();
      const cutoff = now - windowMs;
      const times = (timestamps.get(socketId) ?? []).filter((t) => t > cutoff);
      if (times.length >= maxEvents) return false;
      times.push(now);
      timestamps.set(socketId, times);
      return true;
    },
    remove(socketId: string): void {
      timestamps.delete(socketId);
    },
  };
};

// 30 messages / 10 s per socket — generous for normal use, stops floods
const messageLimiter = makeSocketRateLimiter(30, 10_000);

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

        // Persist first so every recipient gets the canonical MongoDB _id.
        // This eliminates client-side duplicates caused by uuid vs ObjectId mismatch.
        const persisted = await messageService.persistTextMessage({
          userId,
          chatId,
          content: message,
          replyToMessageId,
        });

        if (!persisted.ok) return;

        const realTimeMsg = {
          content: message,
          _id: persisted.messageId,
          sender: {
            _id: userId,
            name: user.name,
            avatar: user.avatar.url,
          },
          chat: chatId,
          createdAt: persisted.createdAt,
          replyTo: persisted.replyTo
            ? {
                messageId: String(persisted.replyTo.messageId),
                content: persisted.replyTo.content,
                senderName: persisted.replyTo.senderName,
                previewAttachment: persisted.replyTo.previewAttachment,
              }
            : undefined,
        };

        const memberSocketIds = getMemberSockets(members);

        io.to(memberSocketIds).emit(NEW_MESSAGE, {
          chatId,
          message: realTimeMsg,
        });

        // NEW_MESSAGE_ALERT and REFETCH_CHATS go to other members only.
        // The sender already updates its chat list locally via mark-read invalidation.
        socket.broadcast
          .to(memberSocketIds)
          .emit(NEW_MESSAGE_ALERT, { chatId });
        socket.broadcast
          .to(memberSocketIds)
          .emit(REFETCH_CHATS, { chatId });
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
