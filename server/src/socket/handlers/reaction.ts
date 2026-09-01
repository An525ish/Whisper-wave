import { MESSAGE_REACTION } from '../../constants/socket-events.js';
import { onSocketEvent } from '../../middlewares/index.js';
import { Message } from '../../models/message.js';
import { logger } from '../../utils/logger.js';
import { chatRoom } from '../../utils/helper.js';
import { socketReactionSchema } from '../../validators/socket.js';
import type { SocketRateLimiter } from '../rateLimiter.js';
import type { SocketSession } from '../types.js';

export const registerReactionHandler = (session: SocketSession, limiter: SocketRateLimiter): void => {
  const { io, socket, userId } = session;

  onSocketEvent(
    socket,
    MESSAGE_REACTION,
    socketReactionSchema,
    async ({ messageId, chatId, emoji }) => {
      const msg = await Message.findById(messageId).select('reactions chat');

      // Verify message belongs to the stated chat (guards against cross-chat spoofing)
      if (!msg || String(msg.chat) !== chatId) return;

      // Each user may have at most one reaction per message. Find their current one (if any).
      const userCurrentEntry = msg.reactions?.find((r) => r.users.some((u) => String(u) === userId));
      const isToggleOff = userCurrentEntry?.emoji === emoji;

      if (isToggleOff) {
        // Clicking the same emoji the user already reacted with → remove it
        await Message.updateOne(
          { _id: messageId },
          { $pull: { 'reactions.$[elem].users': userId } },
          { arrayFilters: [{ 'elem.emoji': emoji }] },
        );
        if ((userCurrentEntry.users.length ?? 0) <= 1) {
          await Message.updateOne({ _id: messageId }, { $pull: { reactions: { emoji } } });
        }
      } else {
        // Clicking a different emoji (or first reaction) → remove old, add new

        if (userCurrentEntry) {
          const prevEmoji = userCurrentEntry.emoji;
          await Message.updateOne(
            { _id: messageId },
            { $pull: { 'reactions.$[elem].users': userId } },
            { arrayFilters: [{ 'elem.emoji': prevEmoji }] },
          );
          // Prune the old entry if this user was the only one
          if (userCurrentEntry.users.length <= 1) {
            await Message.updateOne({ _id: messageId }, { $pull: { reactions: { emoji: prevEmoji } } });
          }
        }

        const targetEntry = msg.reactions?.find((r) => r.emoji === emoji);
        if (targetEntry) {
          await Message.updateOne(
            { _id: messageId },
            { $addToSet: { 'reactions.$[elem].users': userId } },
            { arrayFilters: [{ 'elem.emoji': emoji }] },
          );
        } else {
          await Message.updateOne(
            { _id: messageId },
            { $push: { reactions: { emoji, users: [userId] } } },
          );
        }
      }

      const updated = await Message.findById(messageId).select('reactions').lean();
      const reactions = (updated?.reactions ?? []).map((r) => ({
        emoji: r.emoji,
        users: r.users.map(String),
      }));

      io.to(chatRoom(chatId)).emit(MESSAGE_REACTION, { messageId, chatId, reactions });
    },
    {
      before: () => limiter.allow(socket.id),
      onError: (error) => logger.error({ err: error }, 'MESSAGE_REACTION handler failed'),
    },
  );
};
