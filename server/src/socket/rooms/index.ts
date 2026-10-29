import type { Namespace, Server } from 'socket.io';
import { applyRoomAuth } from './auth.js';
import { handleRoomConnection } from './handlers.js';
import { allInstanceIds, clearInstance, liveCounts } from '../../services/rooms/registry.js';
import { pruneReportTallies } from '../../services/rooms/autohide.js';
import { pruneExpiredMods } from '../../services/rooms/mods.js';
import { onModPresenceChange, resetModPresence } from '../../services/rooms/modPresence.js';
import { lapsedInstanceIds } from '../../services/rooms/sweep.js';
import { livePrivateInstanceIds, purgeIdlePrivateRooms } from '../../services/rooms/lifecycle.js';
import { logger } from '../../utils/logger.js';
import { WAVE_ALIAS, WAVE_COLOR, sweepQuietRooms } from '../../services/rooms/wavebot.js';
import { onFeatureChange } from '../../services/hub.js';
import {
  ROOM_CLOSED,
  ROOM_CLOSED_DISABLED,
  ROOM_MESSAGE,
  ROOM_PAUSED,
  ROOM_RESUMED,
} from '../../constants/room-events.js';
import type { RoomSocket } from '../../types/room.js';

export { evictIdentity } from './evict.js';

/** Wave bot sweep cadence. Quiet rooms only — see `services/rooms/wavebot.ts`. */
const WAVE_SWEEP_MS = 60_000;

/** Live topic rooms — `gid`-identified (guests + members), in-process state. */
export const createRoomsNamespace = (io: Server): void => {
  const nsp = io.of('/rooms');
  nsp.use((socket, next) => applyRoomAuth(socket as RoomSocket, next));
  nsp.on('connection', (socket) => handleRoomConnection(nsp, socket as RoomSocket));

  // Runtime kill-switch: flipping rooms off ends every live room and drops
  // every room socket. (Observer — the hub service knows nothing about sockets.)
  onFeatureChange((feature, enabled) => {
    if (feature === 'rooms' && !enabled) closeAllRooms(io, ROOM_CLOSED_DISABLED, { disconnect: true });
    if (feature === 'privateRooms' && !enabled) void closePrivateRooms(io);
  });

  // Listening rooms: tell every instance of the template when posting pauses/resumes.
  onModPresenceChange((slug, state) => {
    for (const { instanceId } of liveCounts(slug)) {
      nsp.to(instanceId).emit(state === 'paused' ? ROOM_PAUSED : ROOM_RESUMED, { slug });
    }
  });

  // The bot never sleeps while the process does. Unref'd so it can't hold
  // anything open on its own; the sweep itself is a no-op without instances.
  // The same tick enforces room hours mid-session and prunes expiring state.
  setInterval(() => {
    for (const { instanceId, message } of sweepQuietRooms()) {
      nsp.to(instanceId).emit(ROOM_MESSAGE, {
        id: message.id,
        from: { alias: WAVE_ALIAS, color: WAVE_COLOR, role: 'member' as const },
        text: message.text,
        ts: message.ts,
        system: true,
      });
    }
    pruneExpiredMods();
    pruneReportTallies();
    void closeLapsedRooms(io);
    void purgeIdlePrivateRooms(); // self-throttled to hourly; no-op when nothing expired
  }, WAVE_SWEEP_MS).unref();
};

/** `privateRooms` kill-switch: end every live private instance (public rooms keep running). */
const closePrivateRooms = async (io: Server): Promise<void> => {
  try {
    for (const instanceId of await livePrivateInstanceIds()) {
      closeRoomInstance(io, instanceId, 'Private rooms are switched off right now.');
    }
  } catch (err) {
    logger.error({ err }, 'Could not close private rooms on kill-switch');
  }
};

/** Close live instances whose room hours ended under them. */
const closeLapsedRooms = async (io: Server): Promise<void> => {
  for (const instanceId of await lapsedInstanceIds()) {
    closeRoomInstance(io, instanceId, 'This room is closed right now — check back later.');
  }
};

/**
 * Admin close: evict every seat, tell the room why, drop the instance.
 * Sockets stay connected (they may join elsewhere) — only this room ends.
 * `reason` is prose for admin closes; `ROOM_CLOSED_DISABLED` / `_RESTART` are
 * the literal codes for the flag and for shutdown.
 */
export const closeRoomInstance = (io: Server, instanceId: string, reason: string): boolean => {
  const nsp: Namespace = io.of('/rooms');
  const keys = clearInstance(instanceId);
  if (keys.length === 0 && !instanceHasSockets(nsp, instanceId)) return false;
  nsp.to(instanceId).emit(ROOM_CLOSED, { reason });
  for (const socket of nsp.sockets.values()) {
    const roomSocket = socket as RoomSocket;
    if (roomSocket.roomInstanceId === instanceId) {
      roomSocket.leave(instanceId);
      roomSocket.roomInstanceId = undefined;
    }
  }
  return true;
};

/**
 * End every live room: tell every `/rooms` socket why, drop all instances and
 * pointers. `disconnect` also closes the sockets (rooms disabled); shutdown
 * leaves that to `io.close`.
 */
export const closeAllRooms = (io: Server, reason: string, opts: { disconnect: boolean }): void => {
  const nsp = io.of('/rooms');
  nsp.emit(ROOM_CLOSED, { reason });
  for (const instanceId of allInstanceIds()) clearInstance(instanceId);
  resetModPresence();
  for (const socket of nsp.sockets.values()) {
    (socket as RoomSocket).roomInstanceId = undefined;
    if (opts.disconnect) socket.disconnect(true);
  }
};

const instanceHasSockets = (nsp: Namespace, instanceId: string): boolean => {
  const room = nsp.adapter.rooms.get(instanceId);
  return room !== undefined && room.size > 0;
};
