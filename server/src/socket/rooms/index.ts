import type { Namespace, Server, Socket } from 'socket.io';
import { applyRoomAuth } from './auth.js';
import { dropOccupants, handleRoomConnection } from './handlers.js';
import { clearInstance, liveCounts } from '../../services/rooms/registry.js';
import { isRoomOpen } from '../../services/rooms/hours.js';
import { sweepQuietRooms } from '../../services/rooms/wavebot.js';
import * as roomRepo from '../../repositories/room.js';
import { logger } from '../../utils/logger.js';
import { ROOM_CLOSED, ROOM_MESSAGE_EVENT } from '../../constants/room-events.js';
import type { RoomSocket } from '../../types/room.js';

/** Wave bot sweep cadence. Quiet rooms only — see `services/rooms/wavebot.ts`. */
const WAVE_SWEEP_MS = 60_000;

/** Live topic rooms — `gid`-identified (guests + members), in-process state. */
export const createRoomsNamespace = (io: Server): void => {
  const nsp = io.of('/rooms');
  nsp.use((socket, next) => applyRoomAuth(socket as RoomSocket, next));
  nsp.on('connection', (socket) => handleRoomConnection(nsp, socket as RoomSocket));

  // The bot never sleeps while the process does. Unref'd so it can't hold
  // anything open on its own; the sweep itself is a no-op without instances.
  // The same tick enforces room hours mid-session: instances of a room whose
  // hours just lapsed close with a reason instead of lingering silently.
  setInterval(() => {
    for (const { instanceId, message } of sweepQuietRooms()) {
      nsp.to(instanceId).emit(ROOM_MESSAGE_EVENT, {
        id: message.id,
        from: { alias: 'Wave', color: '#ffd47d', role: 'member' as const },
        text: message.text,
        ts: message.ts,
        system: true,
      });
    }
    void closeLapsedRooms(io);
  }, WAVE_SWEEP_MS).unref();
};

/** Close live instances whose room hours ended under them. Best-effort. */
const closeLapsedRooms = async (io: Server): Promise<void> => {
  let templates;
  try {
    templates = await roomRepo.listAll();
  } catch (err) {
    logger.warn({ err }, 'Hours sweep: template read failed, skipping tick');
    return;
  }
  const now = new Date();
  for (const template of templates) {
    if (!template.hours || isRoomOpen(template.hours, now)) continue;
    for (const { instanceId } of liveCounts(template.slug)) {
      closeRoomInstance(io, instanceId, 'This room is closed right now — check back later.');
    }
  }
};

/**
 * Admin close: evict every seat, tell the room why, drop the instance.
 * Sockets stay connected (they may join elsewhere) — only this room ends.
 */
export const closeRoomInstance = (io: Server, instanceId: string, reason: string): boolean => {
  const nsp: Namespace = io.of('/rooms');
  const keys = clearInstance(instanceId);
  dropOccupants(instanceId);
  if (keys.length === 0 && !instanceHasSockets(nsp, instanceId)) return false;
  nsp.to(instanceId).emit(ROOM_CLOSED, { reason });
  for (const socket of nsp.sockets.values()) {
    const roomSocket = socket as Socket & { roomInstanceId?: string };
    if (roomSocket.roomInstanceId === instanceId) {
      roomSocket.leave(instanceId);
      roomSocket.roomInstanceId = undefined;
    }
  }
  return true;
};

const instanceHasSockets = (nsp: Namespace, instanceId: string): boolean => {
  const room = nsp.adapter.rooms.get(instanceId);
  return room !== undefined && room.size > 0;
};
