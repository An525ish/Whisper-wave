import type { Server } from 'socket.io';
import type { RealtimeNotify } from '../types/chat.js';

/** In-memory presence. Swap implementation for Redis in Phase 2. */
const userSocketIds = new Map<string, string>();

export const setUserSocket = (userId: string, socketId: string): void => {
  userSocketIds.set(userId, socketId);
};

export const removeUserSocket = (userId: string): void => {
  userSocketIds.delete(userId);
};

export const getMemberSockets = (
  members: Array<string | { toString(): string }>
): string[] => {
  const socketIds: string[] = [];

  for (const memberId of members) {
    const socketId = userSocketIds.get(memberId.toString());
    if (socketId) socketIds.push(socketId);
  }

  return socketIds;
};

export const getPresenceSize = (): number => userSocketIds.size;

export const getOnlineUserIds = (): string[] => [...userSocketIds.keys()];

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
