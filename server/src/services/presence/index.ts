import type { Server } from 'socket.io';
import type { RealtimeNotify } from '../../types/chat.js';
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

/**
 * Returns the unique peer IDs the user shares a chat with.
 * Used to scope USER_ONLINE / USER_OFFLINE broadcasts — no global fan-out.
 */
export const getChatPeerIds = async (userId: string): Promise<string[]> => {
  const chats = await chatRepo.findDirectChatsForMember(userId);
  const peers = new Set<string>();
  for (const chat of chats) {
    for (const memberId of chat.members) {
      const id = memberId.toString();
      if (id !== userId) peers.add(id);
    }
  }
  return [...peers];
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
  for (const notification of notifications) {
    emitToMembers(io, notification.event, notification.members, notification.data);
  }
};
