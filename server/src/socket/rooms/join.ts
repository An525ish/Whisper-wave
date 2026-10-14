import type { Namespace } from 'socket.io';
import { ROOM_MSG_RING } from '../../constants/rooms.js';
import { ROOM_STATE } from '../../constants/room-events.js';
import { authorizeJoin } from '../../services/rooms/access.js';
import { isStaffed } from '../../services/rooms/modPresence.js';
import { nudgeModsIfWaiting } from '../../services/rooms/modNudge.js';
import { normalizeAlias } from '../../services/rooms/automod.js';
import { assertAliasAllowed, colorForAlias } from '../../services/rooms/membership.js';
import { joinInstance, recentMessages, seatInstanceOf } from '../../services/rooms/registry.js';
import { emitPresence, releaseSeat, seatKeyOf, trackSeat } from './seats.js';
import { toWireMessage } from './wire.js';
import type { RoomJoinInput, RoomSocket } from '../../types/room.js';

/**
 * Seat the socket in an instance and send it the room state.
 *
 * All checks (alias, access/invite, hours, bans) run BEFORE anything is
 * mutated, so a refused join leaves the socket exactly where it was. The
 * previous instance (a different room) is released only once the new seat is
 * held — fully untracked, not just left at the socket level.
 */
export const handleJoin = async (
  nsp: Namespace,
  socket: RoomSocket,
  input: RoomJoinInput
): Promise<string> => {
  const alias = normalizeAlias(input.alias);
  assertAliasAllowed(alias);
  const key = seatKeyOf(socket);

  const { template, role, trust } = await authorizeJoin({
    slug: input.slug,
    gid: socket.gid,
    ...(socket.userId ? { userId: socket.userId } : {}),
    ...(input.invite ? { invite: input.invite } : {}),
    seated: seatInstanceOf(input.slug, key) !== null,
  });

  const previous = socket.roomInstanceId;
  const { instanceId, member, online } = joinInstance({
    template,
    identity: socket.userId
      ? { kind: 'member', userId: socket.userId, gid: socket.gid }
      : { kind: 'guest', gid: socket.gid },
    alias,
    color: input.color ?? colorForAlias(alias),
    role,
    ...(trust ? { trust } : {}),
  });
  if (previous && previous !== instanceId) releaseSeat(nsp, socket, previous);

  await socket.join(instanceId);
  socket.roomInstanceId = instanceId;
  trackSeat(instanceId, key, socket.id);

  const [slug, n] = instanceId.split('#');
  const forMod = member.role !== 'member';
  socket.emit(ROOM_STATE, {
    roomId: instanceId,
    instance: Number(n ?? 1),
    slug,
    title: template.title,
    rules: template.rules,
    // Mods see hidden messages (flagged) so they can `unhide`; nobody else does.
    recent: recentMessages(instanceId, ROOM_MSG_RING, forMod).map((m) => toWireMessage(m, { forMod })),
    online,
    // Listening rooms: the client shows the safety strip, and the paused line when nobody is moderating.
    ...(template.requiresModPresence
      ? { requiresModPresence: true, paused: !isStaffed(template.slug) }
      : {}),
    you: { alias: member.alias, color: member.color, role: member.role },
  });
  emitPresence(nsp, instanceId);
  if (!forMod) nudgeModsIfWaiting(template);
  return instanceId;
};
