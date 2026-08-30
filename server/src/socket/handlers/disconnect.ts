import { USER_OFFLINE } from '../../constants/socket-events.js';
import * as userRepo from '../../repositories/user.js';
import {
  getMemberSockets,
  isUserOnline,
  removeUserSocket,
} from '../../services/index.js';
import { logger } from '../../utils/logger.js';
import type { SocketRateLimiter } from '../rateLimiter.js';
import type { SocketSession } from '../types.js';

export const registerDisconnectHandler = (
  session: SocketSession,
  limiter: SocketRateLimiter
): void => {
  const { io, socket, userId, ghostMode, dmPartnerUserIds } = session;

  socket.on('disconnect', () => {
    limiter.remove(socket.id);
    logger.debug({ userId, socketId: socket.id, ghostMode }, 'User disconnected');

    if (ghostMode) return;

    removeUserSocket(userId, socket.id);
    if (isUserOnline(userId)) return;

    // Recompute peer sockets at disconnect time — sessions may have changed since connect.
    const onlineDmPartnerSocketIds = getMemberSockets(dmPartnerUserIds);

    void (async () => {
      try {
        const lastSeen = await userRepo.updateLastSeen(userId);
        if (onlineDmPartnerSocketIds.length) {
          io.to(onlineDmPartnerSocketIds).emit(USER_OFFLINE, {
            userId,
            lastSeen: lastSeen.toISOString(),
          });
        }
      } catch (error) {
        if (onlineDmPartnerSocketIds.length) {
          io.to(onlineDmPartnerSocketIds).emit(USER_OFFLINE, { userId });
        }
        logger.error({ err: error, userId }, 'Failed to persist lastSeen');
      }
    })();
  });
};
