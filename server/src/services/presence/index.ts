import type { Server } from 'socket.io';
import { chatRoom } from '../../utils/helper.js';
import type { JoinedChat, RealtimeNotify } from '../../types/chat.js';
import * as chatRepo from '../../repositories/chat.js';
import { forgetUserSocket, recordUserSocket } from './store.js';

/**
 * Presence for the signed-in app.
 *
 * Redis holds the cluster-shared record — `presence:sockets:{userId}` → SET of
 * socketIds, written through on every connect and disconnect (see `store.ts`).
 * That is what stops presence being a `Map` that a second Node instance cannot
 * see (A3 in docs/Todo.md).
 *
 * Reads below are served from `localSocketIds`, a registry of the sockets *this*
 * instance owns. That is a deliberate split, not an oversight:
 *
 *   - Every consumer of a socket ID hands it straight to Socket.IO
 *     (`io.to(socketIds)`, `io.sockets.sockets.get(socketId)`), and a Socket.IO
 *     instance can only address sockets attached to it. A socket on another
 *     instance is unaddressable here by construction, so reading it out of Redis
 *     would return an ID we have no way to deliver to.
 *   - `emitToMembers` sits on the message fan-out path. Reading Redis there adds
 *     a round-trip per recipient list to every message sent.
 *
 * So the registry is the addressing cache, and Redis is the record of truth.
 *
 * KNOWN LIMIT — the reads that answer a *cluster-wide* question rather than an
 * addressing one are still instance-local: `isUserOnline`, `resolveOnlinePresence`,
 * `getPresenceSize`, `getOnlineUserIds`. Their call sites are synchronous and live
 * outside this module, so making them accurate means changing those signatures and
 * installing a Socket.IO Redis adapter. Until then a user with one tab on each of
 * two instances is reported online/offline by whichever instance handled the event.
 */
const localSocketIds = new Map<string, Set<string>>();

/**
 * Attach a socket to a user and mirror it into Redis.
 *
 * Stays `void` on purpose. `disconnect.ts` calls `removeUserSocket` and then
 * `isUserOnline` straight afterwards to decide whether to broadcast an offline
 * event, so the registry has to be updated before any await. Returning a promise
 * would invite a future caller to await it and quietly reorder that check against
 * the Redis write.
 */
export const setUserSocket = (userId: string, socketId: string): void => {
  const existing = localSocketIds.get(userId) ?? new Set<string>();
  existing.add(socketId);
  localSocketIds.set(userId, existing);

  void recordUserSocket(userId, socketId);
};

/** Remove a specific socket for a user. Cleans up the user entry when no sockets remain. */
export const removeUserSocket = (userId: string, socketId: string): void => {
  const sockets = localSocketIds.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) localSocketIds.delete(userId);

  void forgetUserSocket(userId, socketId);
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