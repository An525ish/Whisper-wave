import type { Namespace } from 'socket.io';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import * as roomRepo from '../../repositories/room.js';
import * as roomBanRepo from '../../repositories/roomBan.js';
import {
  joinInstance,
  leaveInstance,
  membersOf,
  recentMessages,
  removeMember,
  setLocked,
  setSlowOverride,
  toggleReaction,
} from '../../services/rooms/registry.js';
import { assertJoinAllowed, colorForAlias, identityOf, resolveRoomRole } from '../../services/rooms/membership.js';
import { consumeInviteForJoin } from '../../services/rooms/invites.js';
import { trustForUser } from '../../services/user/trust.js';
import { postRoomMessage } from '../../services/rooms/messaging.js';
import { canModerate, deleteRoomMessage, kickMember, muteMember, shadowMuteMember } from '../../services/rooms/mods.js';
import { auditModAction } from '../../services/audit.js';
import { roomReactionLimiter } from '../../services/rooms/rateLimit.js';
import {
  ROOM_ERROR,
  ROOM_ERROR_CODES,
  ROOM_JOIN,
  ROOM_LEAVE,
  ROOM_MESSAGE,
  ROOM_MESSAGE_EVENT,
  ROOM_MOD,
  ROOM_MOD_ACTION,
  ROOM_PRESENCE,
  ROOM_REACT,
  ROOM_REACTION,
  ROOM_STATE,
} from '../../constants/room-events.js';
import { onSocketEvent } from '../../middlewares/validateSocket.js';
import { roomJoinSchema, roomLeaveSchema, roomMessageSchema, roomModSchema, roomReactSchema } from '../../validators/rooms.js';
import type { RoomSocket } from '../../types/room.js';

/** Presence fan-out at most once per instance per window. */
const PRESENCE_THROTTLE_MS = 5_000;
const lastPresenceEmit = new Map<string, number>();

const emitPresence = (nsp: Namespace, instanceId: string): void => {
  const now = Date.now();
  if (now - (lastPresenceEmit.get(instanceId) ?? 0) < PRESENCE_THROTTLE_MS) return;
  lastPresenceEmit.set(instanceId, now);
  const online = membersOf(instanceId).length;
  nsp.to(instanceId).emit(ROOM_PRESENCE, { online });
};

const errorCodeOf = (err: unknown): string =>
  err instanceof AppError ? err.message : 'unknown';

type JoinInput = { slug: string; alias: string; color?: string; invite?: string };

const handleJoin = async (
  nsp: Namespace,
  socket: RoomSocket,
  input: JoinInput
): Promise<{ instanceId: string; key: string }> => {
  // Leaving first keeps one socket to one instance — rejoin is idempotent
  // in the registry, but the socket room must follow.
  const currentSlug = socket.roomInstanceId?.split('#')[0];
  if (socket.roomInstanceId) {
    socket.leave(socket.roomInstanceId);
    leaveInstance(socket.roomInstanceId, identityOf(socket));
  }

  const template = await roomRepo.findBySlug(input.slug);
  if (!template) throw new AppError(404, ROOM_ERROR_CODES.NOT_FOUND);
  if (template.visibility !== 'official' && template.visibility !== 'public') {
    // Unlisted: the invite is consumed per join (uses counted), so a leaked
    // link has a bounded blast radius by construction. Rejoining the same
    // room on this socket is free — the seat was already proven.
    if (currentSlug !== template.slug) {
      if (!input.invite) throw new AppError(403, ROOM_ERROR_CODES.INVITE_REQUIRED);
      await consumeInviteForJoin(template.slug, input.invite);
    }
  }
  const bans = await roomBanRepo.findLiveBans({ gid: socket.gid, userId: socket.userId });
  assertJoinAllowed({ template, bans });
  // One account read per join (not per message): trust rides the member
  // record so the hot path stays Mongo-free. Guests have no trust to resolve.
  const trust = socket.userId
    ? await trustForUser(socket.userId).catch((err: unknown) => {
        logger.warn({ err, gid: socket.gid }, 'Trust lookup failed — joining as new');
        return null;
      })
    : null;
  const { instanceId, member, online } = joinInstance({
    template,
    identity: identityOf(socket),
    alias: input.alias,
    color: input.color ?? colorForAlias(input.alias),
    role: resolveRoomRole(template, socket.userId),
    ...(trust ? { trust } : {}),
  });

  socket.join(instanceId);
  socket.roomInstanceId = instanceId;

  const [slug, n] = instanceId.split('#');
  socket.emit(ROOM_STATE, {
    roomId: instanceId,
    instance: Number(n ?? 1),
    slug,
    title: template.title,
    rules: template.rules,
    recent: recentMessages(instanceId).map((m) => ({
      id: m.id,
      from: { alias: m.alias, color: m.color, role: m.role },
      text: m.text,
      ts: m.ts,
      ...(m.replyTo ? { replyTo: m.replyTo } : {}),
    })),
    online,
    you: { alias: member.alias, color: member.color, role: member.role },
  });
  emitPresence(nsp, instanceId);
  return { instanceId, key: member.key };
};

type MessageInput = { id?: string; text: string; replyTo?: string };

const handleMessage = async (
  nsp: Namespace,
  socket: RoomSocket,
  input: MessageInput,
  ack: (res: unknown) => void
): Promise<void> => {
  const instanceId = socket.roomInstanceId;
  if (!instanceId) {
    ack({ ok: false, code: ROOM_ERROR_CODES.NOT_JOINED });
    return;
  }

  const result = postRoomMessage({
    instanceId,
    identity: identityOf(socket),
    text: input.text,
    ...(input.id ? { id: input.id } : {}),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });

  if ('ok' in result && result.ok === false) {
    ack({
      ok: false,
      code: result.code,
      ...(result.retryAfterMs ? { retryAfterMs: result.retryAfterMs } : {}),
      ...(result.support ? { support: true } : {}),
    });
    return;
  }
  if (!('message' in result)) {
    ack({ ok: false, code: 'unknown' });
    return;
  }

  const { message } = result;
  const supportAck = 'support' in result && result.support ? { support: true } : {};
  if ('shadowed' in result && result.shadowed) {
    // Shadow-muted: the sender sees their post land; nobody else ever does.
    ack({ ok: true, id: message.id, ...supportAck });
    socket.emit(ROOM_MESSAGE_EVENT, {
      id: message.id,
      from: { alias: message.alias, color: message.color, role: message.role },
      text: message.text,
      ts: message.ts,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });
    return;
  }
  ack({ ok: true, id: message.id, ...supportAck });
  nsp.to(instanceId).emit(ROOM_MESSAGE_EVENT, {
    id: message.id,
    from: { alias: message.alias, color: message.color, role: message.role },
    text: message.text,
    ts: message.ts,
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
  });
};

type ReactInput = { messageId: string; reaction: string };

const handleReact = async (
  nsp: Namespace,
  socket: RoomSocket,
  input: ReactInput
): Promise<unknown> => {
  const instanceId = socket.roomInstanceId;
  if (!instanceId) return { ok: false, code: ROOM_ERROR_CODES.NOT_JOINED };
  const identity = identityOf(socket);
  const key = identity.userId ?? identity.gid;
  if (!key) throw new AppError(401, 'Room identity required');
  if (!roomReactionLimiter.allow(key)) return { ok: false, code: 'rate_limited' };

  const counts = toggleReaction(instanceId, key, input.messageId, input.reaction);
  if (!counts) return { ok: false, code: 'not_found' };
  nsp.to(instanceId).emit(ROOM_REACTION, {
    messageId: input.messageId,
    reaction: input.reaction,
    count: counts[input.reaction] ?? 0,
  });
  return { ok: true, counts };
};

type ModInput = {
  action: 'delete' | 'mute' | 'kick' | 'lock' | 'unlock' | 'slow' | 'shadowmute';
  messageId?: string;
  target?: string;
  minutes?: number;
  ms?: number;
};

const handleMod = async (
  nsp: Namespace,
  socket: RoomSocket,
  input: ModInput,
  occupantId: (instanceId: string, key: string) => string | undefined
): Promise<unknown> => {
  const instanceId = socket.roomInstanceId;
  if (!instanceId) return { ok: false, code: ROOM_ERROR_CODES.NOT_JOINED };
  const identity = identityOf(socket);
  const modKey = identity.userId ?? identity.gid;
  if (!modKey) throw new AppError(401, 'Room identity required');
  if (!canModerate(instanceId, modKey)) return { ok: false, code: 'forbidden' };
  const slug = instanceId.split('#')[0] ?? instanceId;
  const modAlias = membersOf(instanceId).find((m) => m.key === modKey)?.alias ?? 'mod';
  const actor = {
    actorKind: 'mod' as const,
    actorLabel: modAlias,
    actorUserId: socket.userId ?? null,
    actorGid: socket.gid ?? null,
    roomSlug: slug,
    instanceId,
  };

  if (input.action === 'delete') {
    if (!input.messageId) return { ok: false, code: 'invalid_payload' };
    const removed = deleteRoomMessage(instanceId, modKey, input.messageId);
    if (!removed) return { ok: false, code: 'not_found' };
    auditModAction({ ...actor, action: 'delete', target: input.messageId });
    nsp.to(instanceId).emit(ROOM_MOD_ACTION, { action: 'delete', messageId: input.messageId });
    return { ok: true };
  }

  if (!input.target) return { ok: false, code: 'invalid_payload' };
  const target = membersOf(instanceId).find((m) => m.alias === input.target);
  if (!target) return { ok: false, code: 'not_found' };

  if (input.action === 'mute') {
    const minutes = input.minutes ?? 10;
    if (!muteMember(instanceId, modKey, target.key, minutes)) {
      return { ok: false, code: 'forbidden' };
    }
    auditModAction({ ...actor, action: 'mute', target: target.alias, detail: `${minutes} min` });
    const targetSocketId = occupantId(instanceId, target.key);
    if (targetSocketId) {
      nsp.to(targetSocketId).emit(ROOM_MOD_ACTION, { action: 'muted', minutes });
    }
    return { ok: true };
  }

  if (input.action === 'shadowmute') {
    const minutes = input.minutes ?? 60;
    if (!shadowMuteMember(instanceId, modKey, target.key, minutes)) {
      return { ok: false, code: 'forbidden' };
    }
    auditModAction({ ...actor, action: 'shadowmute', target: target.alias, detail: `${minutes} min` });
    // No notice of any kind — that is the entire point of a shadow mute.
    return { ok: true };
  }

  if (input.action === 'lock' || input.action === 'unlock') {
    const locked = input.action === 'lock';
    if (!setLocked(instanceId, locked)) return { ok: false, code: 'not_found' };
    auditModAction({ ...actor, action: locked ? 'lock' : 'unlock' });
    nsp.to(instanceId).emit(ROOM_MOD_ACTION, { action: locked ? 'locked' : 'unlocked' });
    return { ok: true };
  }

  if (input.action === 'slow') {
    if (input.ms === undefined) return { ok: false, code: 'invalid_payload' };
    if (!setSlowOverride(instanceId, input.ms === 0 ? undefined : input.ms)) {
      return { ok: false, code: 'not_found' };
    }
    auditModAction({ ...actor, action: 'slow', detail: `${input.ms} ms` });
    nsp.to(instanceId).emit(ROOM_MOD_ACTION, { action: 'slow', ms: input.ms });
    return { ok: true };
  }

  // kick: short room ban first (so rejoin is refused), then eject live.
  const kicked = await kickMember({
    slug,
    instanceId,
    modKey,
    modAlias: membersOf(instanceId).find((m) => m.key === modKey)?.alias ?? 'mod',
    targetKey: target.key,
    ...(target.gid ? { targetGid: target.gid } : {}),
    ...(target.userId ? { targetUserId: target.userId } : {}),
  });
  if (!kicked) return { ok: false, code: 'forbidden' };
  auditModAction({ ...actor, action: 'kick', target: target.alias });
  const targetSocketId = occupantId(instanceId, target.key);
  if (targetSocketId) {
    const targetSocket = nsp.sockets.get(targetSocketId);
    targetSocket?.leave(instanceId);
    targetSocket?.emit(ROOM_MOD_ACTION, { action: 'kicked' });
  }
  removeMember(instanceId, target.key);
  emitPresence(nsp, instanceId);
  nsp.to(instanceId).emit(ROOM_MOD_ACTION, { action: 'kick', targetAlias: target.alias });
  return { ok: true };
};


/** One connected socket: join → chat → leave, plus drop cleanup. */
export const handleRoomConnection = (nsp: Namespace, socket: RoomSocket): void => {
  const track = (instanceId: string, key: string): void => {
    occupants.set(`${instanceId}:${key}`, socket.id);
  };
  const untrack = (instanceId: string, key: string): void => {
    const mapKey = `${instanceId}:${key}`;
    if (occupants.get(mapKey) === socket.id) occupants.delete(mapKey);
  };
  const occupantId = (instanceId: string, key: string): string | undefined =>
    occupants.get(`${instanceId}:${key}`);

  const leaveTracked = (instanceId: string): void => {
    socket.leave(instanceId);
    socket.roomInstanceId = undefined;
    const identity = identityOf(socket);
    untrack(instanceId, identity.userId ?? identity.gid ?? '');
    leaveInstance(instanceId, identity);
    emitPresence(nsp, instanceId);
  };

  onSocketEvent(socket, ROOM_JOIN, roomJoinSchema, (data) => {
    handleJoin(nsp, socket, data).then(({ instanceId, key }) => track(instanceId, key)).catch((err: unknown) => {
      logger.warn({ err, gid: socket.gid }, 'Room join failed');
      socket.emit(ROOM_ERROR, { code: errorCodeOf(err) });
    });
  });

  onSocketEvent(socket, ROOM_MESSAGE, roomMessageSchema, (data, ...rest) => {
    const ack = rest.find((arg) => typeof arg === 'function') as
      | ((res: unknown) => void)
      | undefined;
    handleMessage(nsp, socket, data, ack ?? (() => undefined)).catch((err: unknown) => {
      logger.warn({ err, gid: socket.gid }, 'Room message failed');
      (ack ?? (() => undefined))({ ok: false, code: errorCodeOf(err) });
    });
  });

  onSocketEvent(socket, ROOM_REACT, roomReactSchema, (data, ...rest) => {
    const ack = rest.find((arg) => typeof arg === 'function') as
      | ((res: unknown) => void)
      | undefined;
    const answer = ack ?? (() => undefined);
    handleReact(nsp, socket, data).then(answer).catch((err: unknown) => {
      logger.warn({ err, gid: socket.gid }, 'Room react failed');
      answer({ ok: false, code: errorCodeOf(err) });
    });
  });

  onSocketEvent(socket, ROOM_MOD, roomModSchema, (data, ...rest) => {
    const ack = rest.find((arg) => typeof arg === 'function') as
      | ((res: unknown) => void)
      | undefined;
    const answer = ack ?? (() => undefined);
    handleMod(nsp, socket, data, occupantId).then(answer).catch((err: unknown) => {
      logger.warn({ err, gid: socket.gid }, 'Room mod action failed');
      answer({ ok: false, code: errorCodeOf(err) });
    });
  });

  onSocketEvent(socket, ROOM_LEAVE, roomLeaveSchema, () => {
    if (socket.roomInstanceId) leaveTracked(socket.roomInstanceId);
  });

  socket.on('disconnect', () => {
    if (!socket.roomInstanceId) return;
    leaveTracked(socket.roomInstanceId);
  });
};

/**
 * Which socket currently holds an instance seat. Kick and mute-notify need
 * the target's socket — without this map a kick is only a registry removal
 * and the kicked client never learns why it stopped receiving.
 *
 * One tab per seat wins (latest socket). Two tabs on one identity share the
 * seat in the registry; the older tab keeps reading until it replays.
 */
const occupants = new Map<string, string>();

/** Forget every seat of a closed instance (admin close). */
export const dropOccupants = (instanceId: string): void => {
  for (const key of occupants.keys()) {
    if (key.startsWith(`${instanceId}:`)) occupants.delete(key);
  }
};
