import { v4 as uuid } from 'uuid';
import { AppError } from '../../utils/AppError.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import { ROOM_SLOW_GUEST_MS, ROOM_SLOW_MEMBER_MS } from '../../constants/rooms.js';
import { appendMessage, instanceSettings, membersOf, recentMessages } from './registry.js';
import { checkRoomMessage, showsSelfHarmSigns } from './automod.js';
import { isMuted, isShadowMuted } from './mods.js';
import { roomMessageLimiter } from './rateLimit.js';
import type { LiveRoomMessage, RoomMemberIdentity } from '../../types/room.js';

export type PostRoomMessageInput = {
  instanceId: string;
  identity: RoomMemberIdentity;
  text: string;
  id?: string;
  replyTo?: string;
};

export type PostRoomMessageResult = {
  message: LiveRoomMessage;
  /** Rendered for the sender only — nobody else ever sees it. */
  shadowed?: boolean;
  /** Self-harm language detected: show the resources card, never auto-ban. */
  support?: boolean;
} | {
  ok: false;
  code: 'rate_limited' | 'muted' | 'slow_mode' | 'blocked_content' | 'blocked_link' | 'duplicate' | 'spam';
  retryAfterMs?: number;
  severe?: boolean;
  /** Self-harm language detected: show the resources card, never auto-ban. */
  support?: boolean;
};

/**
 * Post one room message: membership → flood cap → slow mode → automod → ring.
 *
 * Returns a result, never throws for content verdicts — the namespace maps
 * these straight onto the ack. Only a missing instance/session throws (a
 * caller bug or a restart race, not a user verdict).
 */
export const postRoomMessage = (input: PostRoomMessageInput): PostRoomMessageResult => {
  const key = input.identity.userId ?? input.identity.gid;
  if (!key) throw new AppError(401, 'Room identity required');
  const member = membersOf(input.instanceId).find((m) => m.key === key);
  if (!member) throw new AppError(403, ROOM_ERROR_CODES.NOT_JOINED);

  if (isMuted(input.instanceId, key)) {
    return { ok: false, code: 'muted' };
  }

  if (isShadowMuted(input.instanceId, key)) {
    const now = Date.now();
    return {
      message: {
        id: input.id ?? uuid(),
        alias: member.alias,
        color: member.color,
        role: member.role,
        text: input.text.trim(),
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
        ts: now,
      },
      shadowed: true,
      ...(showsSelfHarmSigns(input.text) ? { support: true as const } : {}),
    };
  }

  if (!roomMessageLimiter.allow(key)) {
    return { ok: false, code: 'rate_limited' };
  }

  const now = Date.now();
  const support = showsSelfHarmSigns(input.text);
  const settings = instanceSettings(input.instanceId);
  const verdict = checkRoomMessage({
    text: input.text,
    sender: input.identity,
    // Mods, hosts and trusted members act fast and link freely; everyone
    // else is gated. Trust resolves once at join — never per message.
    linksAllowed: member.role !== 'member' || member.trust === 'trusted',
    slowModeMs: member.role === 'member'
      ? (settings?.slowOverrideMs ?? (input.identity.kind === 'guest' ? ROOM_SLOW_GUEST_MS : ROOM_SLOW_MEMBER_MS))
      : 0,
    msSinceLastPost: member.lastPostAt === undefined ? undefined : now - member.lastPostAt,
    recentTexts: recentMessages(input.instanceId)
      .filter((m) => m.alias === member.alias)
      .slice(-5)
      .map((m) => m.text),
    now,
  });

  if (!verdict.allowed) return { ok: false, ...verdict, ...(support ? { support: true as const } : {}) };

  member.lastPostAt = now;
  const message = appendMessage(input.instanceId, {
    ...(input.id ? { id: input.id } : {}),
    alias: member.alias,
    color: member.color,
    role: member.role,
    text: input.text.trim(),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    ts: now,
  });
  if (!message) throw new AppError(410, 'Room restarted — rejoin to continue');

  return { message, ...(support ? { support: true as const } : {}) };
};
