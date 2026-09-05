import {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from '../../constants/socket-events.js';
import { onSocketEvent } from '../../middlewares/index.js';
import { messageService } from '../../services/index.js';
import { logger } from '../../utils/logger.js';
import { chatRoom } from '../../utils/helper.js';
import { socketNewMessageSchema } from '../../validators/socket.js';
import type { SocketRateLimiter } from '../rateLimiter.js';
import type { SocketSession } from '../types.js';

export const registerMessageHandler = (
  session: SocketSession,
  limiter: SocketRateLimiter
): void => {
  const { io, socket, userId, user } = session;

  onSocketEvent(
    socket,
    NEW_MESSAGE,
    socketNewMessageSchema,
    async ({ message, chatId, replyToMessageId }) => {
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
        replyTo: messageService.serializeReplyToClient(persisted.replyTo),
      };

      const eventPayload = { chatId, message: realTimeMsg };

      io.to(chatRoom(chatId)).emit(NEW_MESSAGE, eventPayload);
      socket.broadcast.to(chatRoom(chatId)).emit(NEW_MESSAGE_ALERT, { chatId });
      // Let other members refetch so deleted chats reappear when a new message arrives
      socket.broadcast.to(chatRoom(chatId)).emit(REFETCH_CHATS, { chatId });
    },
    {
      before: () => limiter.allow(socket.id),
      onError: (error) => logger.error({ err: error }, 'NEW_MESSAGE handler failed'),
    }
  );
};
