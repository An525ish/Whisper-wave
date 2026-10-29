import { v4 as uuid } from 'uuid';
import { AppError } from '../../utils/AppError.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import { ROOM_SLOW_GUEST_MS, ROOM_SLOW_MEMBER_MS } from '../../constants/rooms.js';
import { appendMessage, findMessage, instanceSettings, membersOf, recentMessages } from './registry.js';
import { checkRoomMessage, showsSelfHarmSigns } from './automod.js';
import { checkChallenge } from './challenge.js';
import { isPostingPaused, isStaffed } from './modPresence.js';
import { strictProfileFor } from './strictProfile.js';
import { isMuted, isShadowMuted } from './mods.js';
import { roomMessageLimiter } from './rateLimit.js';
import { reportSevereHit } from './severe.js';
import { assertMediaAllowed, resolveRoomMedia } from './media.js';
import { bumpWhisperStats } from '../match/stats.js';
import type { PostRoomMessageInput, PostRoomMessageResult } from '../../types/room.js';

/**
 * Post one room message: membership → mod gate (listening rooms) → mute → guest challenge → flood cap →
 * slow mode + automod → ring.
 *
 * Async only because the Turnstile check calls Cloudflare. Returns a result, never throws for content verdicts — the namespace maps
 * these straight onto the ack. Only a missing seat/instance throws (a caller
 * bug or a restart race, not a user verdict).
 *
 * Shadow-muted senders go through the SAME limiter and automod as everyone
 * (a shadow mute must not be a free pass to spam or to trip severe filters
 * unreported); only the final step differs — the post is echoed to them and
 * never stored. Ids are server-minted; the sender's own id is a `clientId`
 * the caller echoes back.
 */
export const postRoomMessage = async (input: PostRoomMessageInput): Promise<PostRoomMessageResult> => {
  const key = input.identity.userId ?? input.identity.gid;
  if (!key) throw new AppError(401, 'Room identity required');
  const { instanceId } = input;
  const member = membersOf(instanceId).find((m) => m.key === key);
  if (!member) throw new AppError(403, ROOM_ERROR_CODES.NOT_JOINED);

  const settings = instanceSettings(instanceId);
  const slug = instanceId.split('#')[0] ?? instanceId;
  // Listening rooms: reading is open, posting waits for a moderator.
  if (isPostingPaused(settings?.requiresModPresence, isStaffed(slug))) {
    return { ok: false, code: ROOM_ERROR_CODES.MOD_ABSENT };
  }

  if (isMuted(instanceId, key)) return { ok: false, code: 'muted' };

  // Policy first (cheap): members only, and only kinds this room allows.
  if (input.media) {
    try {
      assertMediaAllowed(settings?.media, input.media.kind, input.identity.kind === 'member');
    } catch {
      return { ok: false, code: ROOM_ERROR_CODES.MEDIA_NOT_ALLOWED };
    }
  }

  const senderGid = member.gid ?? input.identity.gid ?? key;
  const gate = await checkChallenge({
    gid: senderGid,
    isMember: input.identity.kind === 'member',
    ...(input.challenge ? { answer: input.challenge } : {}),
  });
  if (!gate.ok) {
    bumpWhisperStats({ [`rgate:${gate.code}`]: 1 });
    return gate;
  }

  if (!roomMessageLimiter.allow(key)) return { ok: false, code: 'rate_limited' };

  const now = Date.now();
  const text = input.text.trim();
  const support = showsSelfHarmSigns(text);
  const strict = settings?.requiresModPresence ? strictProfileFor(member.role) : undefined;
  // The R2 check comes after the flood cap, so spam can't turn into storage reads.
  let media;
  if (input.media) {
    try {
      media = await resolveRoomMedia({
        instanceId,
        memberKey: key,
        isMember: input.identity.kind === 'member',
        media: input.media,
      });
    } catch {
      return { ok: false, code: ROOM_ERROR_CODES.MEDIA_FAILED };
    }
  }

  const slowModeMs =
    member.role === 'member'
      ? (settings?.slowOverrideMs ?? (input.identity.kind === 'guest' ? ROOM_SLOW_GUEST_MS : ROOM_SLOW_MEMBER_MS))
      : 0;
  const msSinceLastPost = member.lastPostAt === undefined ? undefined : now - member.lastPostAt;

  // A photo-only post has no text to scan: it still obeys slow mode.
  const verdict: ReturnType<typeof checkRoomMessage> = text === ''
    ? slowModeMs > 0 && msSinceLastPost !== undefined && msSinceLastPost < slowModeMs
      ? { allowed: false, code: 'slow_mode', retryAfterMs: slowModeMs - msSinceLastPost }
      : { allowed: true }
    : checkRoomMessage({
    text,
    sender: input.identity,
    // Mods, hosts and trusted members act fast and link freely; everyone
    // else is gated. Trust resolves once at join — never per message.
    linksAllowed: member.role !== 'member' || (member.trust === 'trusted' && !strict?.blockLinks),
    slowModeMs,
    msSinceLastPost,
    recentTexts: recentMessages(instanceId)
      .filter((m) => m.alias === member.alias)
      .slice(-Math.max(5, strict?.duplicateWindow ?? 5))
      .map((m) => m.text),
    now,
    ...(strict ? { strict } : {}),
  });

  if (!verdict.allowed) {
    bumpWhisperStats({ [`rblock_${input.identity.kind}`]: 1, [`rblock:${verdict.code}`]: 1 });
    if (verdict.severe) {
      reportSevereHit({
        instanceId,
        slug,
        member,
        senderGid,
        text,
        category: verdict.category ?? 'blocked_word',
        now,
      });
    }
    return {
      ok: false,
      code: verdict.code,
      ...(verdict.retryAfterMs ? { retryAfterMs: verdict.retryAfterMs } : {}),
      ...(support ? { support: true as const } : {}),
    };
  }

  member.lastPostAt = now;
  // A reply must point at a live, visible message of THIS instance.
  const parent = input.replyTo ? findMessage(instanceId, input.replyTo) : null;
  const replyTo = parent && !parent.hidden ? parent.id : undefined;
  const body = {
    alias: member.alias,
    color: member.color,
    role: member.role,
    ...(member.avatar ? { avatar: member.avatar } : {}),
    text,
    ...(media ? { media } : {}),
    senderGid,
    ...(member.userId ? { senderUserId: member.userId } : {}),
    ...(replyTo ? { replyTo } : {}),
    ts: now,
  };

  if (isShadowMuted(instanceId, key)) {
    return { message: { id: uuid(), ...body }, shadowed: true, ...(support ? { support: true as const } : {}) };
  }
  const message = appendMessage(instanceId, body);
  if (!message) throw new AppError(410, 'Room restarted — rejoin to continue');
  bumpWhisperStats({ [`rm_${input.identity.kind}`]: 1, [`rmsg:${slug}`]: 1, ...(media ? { rmedia: 1 } : {}) });
  return { message, ...(support ? { support: true as const } : {}) };
};
