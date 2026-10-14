import type { Namespace } from 'socket.io';
import { auditModAction } from '../../services/audit.js';
import { aliasKey } from '../../services/rooms/automod.js';
import { membersOf, setLocked, setSlowOverride } from '../../services/rooms/registry.js';
import {
  canModerate,
  deleteRoomMessage,
  kickMember,
  muteMember,
  shadowMuteMember,
  unhideRoomMessage,
} from '../../services/rooms/mods.js';
import { ROOM_ERROR_CODES, ROOM_MOD_ACTION } from '../../constants/room-events.js';
import { currentInstance, evictSeat, seatKeyOf, seatSockets } from './seats.js';
import { toWireMessage } from './wire.js';
import type { RoomModActor, RoomModInput, RoomSocket } from '../../types/room.js';

const { FORBIDDEN, INVALID_PAYLOAD, NOT_FOUND } = ROOM_ERROR_CODES;
const fail = (code: string): { ok: false; code: string } => ({ ok: false, code });
const OK = { ok: true } as const;

/**
 * One moderation action. Returns the ack body. Everything is checked against
 * the mod's CURRENT seat; punitive actions also go through the role hierarchy
 * (mods cannot touch the host or each other), and every denial is `forbidden`.
 */
export const handleMod = async (
  nsp: Namespace,
  socket: RoomSocket,
  input: RoomModInput
): Promise<Record<string, unknown>> => {
  const instanceId = currentInstance(socket);
  if (!instanceId) return fail(ROOM_ERROR_CODES.NOT_JOINED);
  const modKey = seatKeyOf(socket);
  if (!canModerate(instanceId, modKey)) return fail(FORBIDDEN);

  const slug = instanceId.split('#')[0] ?? instanceId;
  const modAlias = membersOf(instanceId).find((m) => m.key === modKey)?.alias ?? 'mod';
  const actor = {
    actorKind: 'mod' as const,
    actorLabel: modAlias,
    actorUserId: socket.userId ?? null,
    actorGid: socket.gid,
    roomSlug: slug,
    instanceId,
  };
  const announce = (payload: Record<string, unknown>): void => {
    nsp.to(instanceId).emit(ROOM_MOD_ACTION, payload);
  };

  switch (input.action) {
    case 'delete': {
      if (!input.messageId) return fail(INVALID_PAYLOAD);
      if (!deleteRoomMessage(instanceId, modKey, input.messageId)) return fail(NOT_FOUND);
      auditModAction({ ...actor, action: 'delete', target: input.messageId });
      // Everyone drops it; mods keep it greyed (their ROOM_STATE carries it flagged `hidden`).
      announce({ action: 'delete', messageId: input.messageId });
      return OK;
    }
    case 'unhide': {
      if (!input.messageId) return fail(INVALID_PAYLOAD);
      const message = unhideRoomMessage(instanceId, modKey, input.messageId);
      if (!message) return fail(NOT_FOUND);
      auditModAction({ ...actor, action: 'unhide', target: input.messageId });
      announce({ action: 'unhide', messageId: message.id, message: toWireMessage(message) });
      return OK;
    }
    case 'lock':
    case 'unlock': {
      const locked = input.action === 'lock';
      if (!setLocked(instanceId, locked)) return fail(NOT_FOUND);
      auditModAction({ ...actor, action: input.action });
      announce({ action: locked ? 'locked' : 'unlocked' });
      return OK;
    }
    case 'slow': {
      if (input.ms === undefined) return fail(INVALID_PAYLOAD);
      if (!setSlowOverride(instanceId, input.ms === 0 ? undefined : input.ms)) return fail(NOT_FOUND);
      auditModAction({ ...actor, action: 'slow', detail: `${input.ms} ms` });
      announce({ action: 'slow', ms: input.ms });
      return OK;
    }
    default:
      return handleTargeted(nsp, instanceId, modKey, actor, input, announce);
  }
};

/** mute / shadowmute / kick — actions on one person, named by alias. */
const handleTargeted = async (
  nsp: Namespace,
  instanceId: string,
  modKey: string,
  actor: RoomModActor,
  input: RoomModInput,
  announce: (payload: Record<string, unknown>) => void
): Promise<Record<string, unknown>> => {
  if (!input.target) return fail(INVALID_PAYLOAD);
  const wanted = aliasKey(input.target);
  const target = membersOf(instanceId).find((m) => aliasKey(m.alias) === wanted);
  if (!target) return fail(NOT_FOUND);

  if (input.action === 'mute') {
    const minutes = input.minutes ?? 10;
    if (!muteMember(instanceId, modKey, target.key, minutes)) return fail(FORBIDDEN);
    auditModAction({ ...actor, action: 'mute', target: target.alias, detail: `${minutes} min` });
    nsp.to(seatSockets(instanceId, target.key)).emit(ROOM_MOD_ACTION, { action: 'muted', minutes });
    return OK;
  }

  if (input.action === 'shadowmute') {
    const minutes = input.minutes ?? 60;
    if (!shadowMuteMember(instanceId, modKey, target.key, minutes)) return fail(FORBIDDEN);
    auditModAction({ ...actor, action: 'shadowmute', target: target.alias, detail: `${minutes} min` });
    // No notice of any kind — that is the entire point of a shadow mute.
    return OK;
  }

  // kick: short room ban first (so rejoin is refused), then eject every tab.
  const kicked = await kickMember({
    slug: actor.roomSlug ?? '',
    instanceId,
    modKey,
    modAlias: actor.actorLabel,
    targetKey: target.key,
    ...(target.gid ? { targetGid: target.gid } : {}),
    ...(target.userId ? { targetUserId: target.userId } : {}),
  });
  if (!kicked) return fail(FORBIDDEN);
  auditModAction({ ...actor, action: 'kick', target: target.alias });
  evictSeat(nsp, instanceId, target.key, 'kicked');
  announce({ action: 'kick', targetAlias: target.alias });
  return OK;
};
