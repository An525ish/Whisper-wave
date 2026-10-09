import type { Server } from 'socket.io';
import { chatRoom } from '../../utils/helper.js';
import type { JoinedChat, RealtimeNotify } from '../../types/chat.js';
import * as chatRepo from '../../repositories/chat.js';

/**
 * Presence for the signed-in app — an in-process registry of the sockets THIS
 * instance owns.
 *
 * There used to be a Redis mirror (`presence:sockets:{userId}`, written on every
 * connect and disconnect). Nothing ever read it, and every write was a billed
 * Upstash command, so it was removed. When a second instance / a Socket.IO Redis
 * adapter arrives, bring a cluster-shared record back WITH a reader.
 *
 * Every consumer of a socket ID hands it straight to Socket.IO
 * (`io.to(socketIds)`, `io.sockets.sockets.get(socketId)`), and a Socket.IO
 * instance can only address sockets attached to it, so this registry is the right
 * source for addressing regardless.
 *
 * KNOWN LIMIT — the reads that answer a *cluster-wide* question rather than an
 * addressing one are instance-local: `isUserOnline`, `resolveOnlinePresence`,
 * `getPresenceSize`, `getOnlineUserIds`. Until a Socket.IO Redis adapter is
 * installed a user with one tab on each of two instances is reported
 * online/offline by whichever instance handled the event.
 */
const localSocketIds = new Map<string, Set<string>>();

/**
 * Attach a socket to a user.
 *
 * Synchronous on purpose: `disconnect.ts` calls `removeUserSocket` and then
 * `isUserOnline` straight afterwards to decide whether to broadcast an offline
 * event, so the registry has to be updated before any await.
 */
export const setUserSocket = (userId: string, socketId: string): void => {
  const existing = localSocketIds.get(userId) ?? new Set<string>();
  existing.add(socketId);
  localSocketIds.set(userId, existing);
};

/** Remove a specific socket for a user. Cleans up the user entry when no sockets remain. */
export const removeUserSocket = (userId: string, socketId: string): void => {
  const sockets = localSocketIds.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) localSocketIds.delete(userId);
};

/** Returns true when the user has at least one connected socket. */
export const isUserOnline = (userId: string): boolean => {
  const sockets = localSocketIds.get(userId);
  return Boolean(sockets?.size);
};

export const getMemberSockets = (
  members: Array<string | { toString(): string }>
): string[] => {
  const socketIds: string[] = [];

  for (const memberId of members) {
    const sockets = localSocketIds.get(memberId.toString());
    if (sockets) socketIds.push(...sockets);
  }

  return socketIds;
};

export const getPresenceSize = (): number => localSocketIds.size;

export const getOnlineUserIds = (): string[] => [...localSocketIds.keys()];

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
    const sockets = localSocketIds.get(id);
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
        const excludeSockets = [...(localSocketIds.get(excludeUserId) ?? [])];
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