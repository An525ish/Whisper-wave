import type { Server } from 'socket.io';
import { ROOM_MOD_ACTION } from '../../constants/room-events.js';
import { allInstanceIds, membersOf, removeMember } from '../../services/rooms/registry.js';
import { releaseSeat, seatKeyOf, seatSockets } from './seats.js';
import type { RoomSocket } from '../../types/room.js';

/**
 * Remove an identity from live rooms right now (ban from the admin surface).
 *
 * Matches by `gid` and/or `userId` — across every instance, or only `slug`'s.
 * Each matching socket is told (`ROOM_MOD_ACTION { action: reason }`), leaves
 * the socket room, has `roomInstanceId` cleared and is untracked; a seat is
 * freed once its last tab is gone. Sockets stay connected. Returns how many
 * seats were affected.
 */
export const evictIdentity = (
  io: Server,
  ids: { gid?: string; userId?: string },
  opts: { slug?: string; reason: 'banned' | 'kicked' } = { reason: 'banned' }
): number => {
  const nsp = io.of('/rooms');
  const matches = (gid?: string, userId?: string): boolean =>
    (ids.gid !== undefined && gid === ids.gid) || (ids.userId !== undefined && userId === ids.userId);
  const inScope = (instanceId: string): boolean => !opts.slug || instanceId.split('#')[0] === opts.slug;
  const seats = new Set<string>();

  for (const raw of nsp.sockets.values()) {
    const socket = raw as RoomSocket;
    const instanceId = socket.roomInstanceId;
    if (!instanceId || !inScope(instanceId) || !matches(socket.gid, socket.userId)) continue;
    socket.emit(ROOM_MOD_ACTION, { action: opts.reason });
    seats.add(`${instanceId}|${seatKeyOf(socket)}`);
    releaseSeat(nsp, socket, instanceId);
  }

  // Seats with no live socket behind them (should not exist) — drop them too.
  for (const instanceId of allInstanceIds().filter(inScope)) {
    for (const member of membersOf(instanceId)) {
      if (matches(member.gid, member.userId) && seatSockets(instanceId, member.key).length === 0) {
        removeMember(instanceId, member.key);
        seats.add(`${instanceId}|${member.key}`);
      }
    }
  }
  return seats.size;
};
