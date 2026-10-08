import { MESSAGE_REACTION } from '../../constants/socket-events.js';
import { onSocketEvent } from '../../middlewares/index.js';
import { chatService } from '../../services/index.js';
import { logger } from '../../utils/logger.js';
import { chatRoom } from '../../utils/helper.js';
import { socketReactionSchema } from '../../validators/socket.js';
import type { SocketRateLimiter } from '../../types/anonSocket.js';
import type { SocketSession } from '../types.js';

export const registerReactionHandler = (session: SocketSession, limiter: SocketRateLimiter): void => {
  const { io, socket, userId } = session;

  onSocketEvent(
    socket,
    MESSAGE_REACTION,
    socketReactionSchema,
    async ({ messageId, chatId, emoji }) => {
      const reactions = await chatService.toggleMessageReaction({
        messageId,
        chatId,
        emoji,
        userId,
      });
      // null = the message isn't in the stated chat. Nothing was written, so
      // there is nothing to broadcast — broadcasting here would blank the
      // bubble's real reactions for everyone in the room.
      if (!reactions) return;

      io.to(chatRoom(chatId)).emit(MESSAGE_REACTION, { messageId, chatId, reactions });
    },
    {
      before: () => limiter.allow(socket.id),
      onError: (error) => logger.error({ err: error }, 'MESSAGE_REACTION handler failed'),
    },
  );
};