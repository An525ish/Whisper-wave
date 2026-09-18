import { ONLINE_USERS, USER_ONLINE } from '../../constants/socket-events.js';
import {
  getDmPartnerUserIds,
  loadJoinedChatsForConnect,
  resolveOnlinePresence,
  setUserSocket,
} from '../../services/index.js';
import { logger } from '../../utils/logger.js';
import { joinSocketToChatRooms } from '../rooms.js';
import type { SocketSession } from '../types.js';
import type { Server, Socket } from 'socket.io';

export const initSocketSession = async (
  io: Server,
  socket: Socket
): Promise<SocketSession | null> => {
  const user = socket.user;
  if (!user) {
    socket.disconnect(true);
    return null;
  }

  const userId = user._id.toString();
  const ghostMode = socket.isImpersonated === true;
  const joinedChats = ghostMode ? [] : await loadJoinedChatsForConnect(userId);
  const dmPartnerUserIds = getDmPartnerUserIds(joinedChats, userId);
  const { onlineUserIds: onlineDmPartnerUserIds, onlineSocketIds: onlineDmPartnerSocketIds } =
    resolveOnlinePresence(dmPartnerUserIds);

  if (!ghostMode) {
    setUserSocket(userId, socket.id);
    try {
      await joinSocketToChatRooms(socket, joinedChats);
    } catch (err) {
      logger.error({ err, userId }, 'Failed to join socket to chat rooms — disconnecting');
      socket.disconnect(true);
      return null;
    }
    if (onlineDmPartnerSocketIds.length) {
      io.to(onlineDmPartnerSocketIds).emit(USER_ONLINE, { userId });
    }
  }

  logger.debug({ userId, socketId: socket.id, ghostMode }, 'User connected');

  socket.emit(ONLINE_USERS, { userIds: onlineDmPartnerUserIds });

  return { io, socket, userId, user, ghostMode, dmPartnerUserIds };
};
