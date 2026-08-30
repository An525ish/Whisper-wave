import type { Server } from 'socket.io';
import { chatRoom } from '../../utils/helper.js';
import type { JoinedChat, RealtimeNotify } from '../../types/chat.js';
import * as chatRepo from '../../repositories/chat.js';

/**
 * In-memory presence. Each user can have multiple sockets (multiple tabs/devices).
 * Swap for Redis in Phase 2.
 */
const userSocketIds = new Map<string, Set<string>>();

export const setUserSocket = (userId: string, socketId: string): void => {
  const existing = userSocketIds.get(userId) ?? new Set<string>();
  existing.add(socketId);
  userSocketIds.set(userId, existing);
};

/** Remove a specific socket for a user. Cleans up the user entry when no sockets remain. */
export const removeUserSocket = (userId: string, socketId: string): void => {
  const sockets = userSocketIds.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) userSocketIds.delete(userId);
};

/** Returns true when the user has at least one connected socket. */
export const isUserOnline = (userId: string): boolean => {
  const sockets = userSocketIds.get(userId);
  return Boolean(sockets?.size);
};

export const getMemberSockets = (
  members: Array<string | { toString(): string }>
): string[] => {
  const socketIds: string[] = [];

  for (const memberId of members) {
    const sockets = userSocketIds.get(memberId.toString());
    if (sockets) socketIds.push(...sockets);
  }

  return socketIds;
};

export const getPresenceSize = (): number => userSocketIds.size;

export const getOnlineUserIds = (): string[] => [...userSocketIds.keys()];

export const loadJoinedChatsForConnect = async (
  userId: string
): Promise<JoinedChat[]> => chatRepo.findJoinedChatsForConnect(userId);

/** DM partner user IDs from joined chats (no extra DB round-trip). */
export const getDmPartnerUserIds = (
  joinedChats: JoinedChat[],
  userId: string
): string[] => {
  const dmPartnerUserIds: string[] = [];
  for (const chat of joinedChats) {
    if (chat.groupChat) continue;
    for (const memberId of chat.members) {
      const id = memberId.toString();
      if (id !== userId) dmPartnerUserIds.push(id);
    }
  }
  return dmPartnerUserIds;
};

/** Which of the given users are online — user IDs and their socket IDs in one pass. */
export const resolveOnlinePresence = (
  userIds: Array<string | { toString(): string }>
): { onlineUserIds: string[]; onlineSocketIds: string[] } => {
  const onlineUserIds: string[] = [];
  const onlineSocketIds: string[] = [];

  for (const memberId of userIds) {
    const id = memberId.toString();
    const sockets = userSocketIds.get(id);
    if (!sockets?.size) continue;
    onlineUserIds.push(id);
    onlineSocketIds.push(...sockets);
  }

  return { onlineUserIds, onlineSocketIds };
};

export const emitToMembers = (
  io: Server | undefined,
  event: string,
  members: Array<string | { toString(): string }>,
  data?: unknown
): void => {
  if (!io) return;

  const memberSocketIds = getMemberSockets(members);
  if (memberSocketIds.length === 0) return;

  io.to(memberSocketIds).emit(event, data);
};

export const flushNotifications = (
  io: Server | undefined,
  notifications: RealtimeNotify[]
): void => {
  if (!io) return;

  for (const { event, chatId, members, excludeUserId, data } of notifications) {
    if (chatId) {
      if (excludeUserId) {
        const excludeSockets = [...(userSocketIds.get(excludeUserId) ?? [])];
        const emitter = excludeSockets.length
          ? io.to(chatRoom(chatId)).except(excludeSockets)
          : io.to(chatRoom(chatId));
        emitter.emit(event, data);
      } else {
        io.to(chatRoom(chatId)).emit(event, data);
      }
      continue;
    }
    if (members?.length) {
      emitToMembers(io, event, members, data);
    }
  }
};
