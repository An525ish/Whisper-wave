import { z } from 'zod';
import { ROOM_REACTIONS } from '../constants/room-reactions.js';
import { reportReason } from './match.js';

/** Aliases the room may never display — the bot and the team only. */
const RESERVED_ALIASES = ['wave', 'whisper', 'system', 'admin', 'moderator', 'host'];

export const roomAliasSchema = z
  .string()
  .trim()
  .min(1, 'Pick a display name')
  .max(24, 'Display names are 24 characters at most')
  .refine(
    (alias) => !RESERVED_ALIASES.includes(alias.toLowerCase()),
    'That name is reserved'
  );

export const roomColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex code like #7dffb8')
  .optional();

export const roomSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9-]+$/, 'Unknown room');

/** Invite tokens are base64url, minted server-side. */
const inviteTokenSchema = z
  .string()
  .min(20)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid invite');

/** `ROOM_JOIN` — identity is the persona for this room only. */
export const roomJoinSchema = z.object({
  slug: roomSlugSchema,
  alias: roomAliasSchema,
  color: roomColorSchema,
  /** Required for unlisted rooms; ignored otherwise. */
  invite: inviteTokenSchema.optional(),
});

const messageIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, 'Message id may only contain letters, digits, - and _');

/** `ROOM_MESSAGE` — acked. `id` is the sender's idempotency key. */
export const roomMessageSchema = z.object({
  id: messageIdSchema.optional(),
  text: z.string().trim().min(1).max(1000),
  replyTo: messageIdSchema.optional(),
});

/** `ROOM_LEAVE` — payload-less. */
export const roomLeaveSchema = z.object({}).passthrough().optional();

/** `ROOM_REACT` — acked with the new counts. */
export const roomReactSchema = z.object({
  messageId: messageIdSchema,
  reaction: z.enum(ROOM_REACTIONS),
});

/** `ROOM_MOD` — mods and hosts only; every denial acks `forbidden`. */
export const roomModSchema = z.object({
  action: z.enum(['delete', 'mute', 'kick', 'lock', 'unlock', 'slow', 'shadowmute']),
  /** Required for `delete`. */
  messageId: messageIdSchema.optional(),
  /** Target alias for `mute` / `kick` / `shadowmute` (aliases are unique per instance). */
  target: z.string().trim().min(1).max(24).optional(),
  /** Required for `mute`: 1 min – 24 h. */
  minutes: z.number().int().min(1).max(1440).optional(),
  /** Required for `slow`: per-instance slow mode, 0 (off) – 30 s. */
  ms: z.number().int().min(0).max(30_000).optional(),
});

/** `POST /api/rooms/:slug/report` — the reporter names a message, never a person. */
export const roomReportSchema = z.object({
  messageId: messageIdSchema,
  reason: reportReason,
  details: z.string().max(500).optional(),
});

/** Host edit: title, description and rules only — slug, type and visibility never move via this path. */
export const hostRoomEditSchema = z.object({
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(280),
  rules: z.array(z.string().trim().min(1).max(140)).min(1).max(10),
});

/** `:slug` / `:id` params on the rooms routes. */
export const roomSlugParamSchema = z.object({
  slug: roomSlugSchema,
});

/** `GET /api/rooms/:slug?invite=` — unlisted rooms need the token. */
export const roomInfoQuerySchema = z.object({
  invite: inviteTokenSchema.optional(),
});

/** `POST /api/rooms/:slug/invites` — hosts and mods only. */
export const roomInviteCreateSchema = z.object({
  maxUses: z.number().int().min(1).max(1000).nullable().default(null),
  ttlDays: z.number().int().min(1).max(30).default(7),
});

/** Combined params for `DELETE /:slug/invites/:id` (one parse, no clobber). */
export const roomSlugInviteParamSchema = z.object({
  slug: roomSlugSchema,
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid invite id'),
});

/** Admin: create or edit a room template (official rooms included). */
export const adminRoomUpsertSchema = z.object({
  slug: roomSlugSchema,
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(280),
  rules: z.array(z.string().trim().min(1).max(140)).max(10).default([]),
  lang: z.string().trim().min(1).max(20).default('en'),
  official: z.boolean().default(false),
  hours: z
    .object({
      days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
      start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      tz: z.string().min(1).max(60),
    })
    .nullable()
    .default(null),
  visibility: z.enum(['official', 'public', 'unlisted']),
  /** Wave Team / volunteer mod account ids. Omitted leaves mods untouched. */
  mods: z.array(z.string().min(1)).max(20).optional(),
});

/** Admin: close one live instance right now. */
export const adminRoomCloseSchema = z.object({
  reason: z.string().trim().min(1).max(140).default('Closed by the Wave team.'),
});

/** Admin: ban an identity from one room or all rooms. */
export const adminRoomBanSchema = z.object({
  roomSlug: roomSlugSchema.nullable(),
  gid: z.string().uuid().nullable().default(null),
  userId: z.string().min(1).nullable().default(null),
  minutes: z.number().int().min(1).max(60 * 24 * 365),
  reason: z.string().trim().min(1).max(280),
}).refine((b) => b.gid ?? b.userId, 'Ban someone: gid or userId is required');

/** Admin: feature kill-switch — one surface off or back on, immediately. */
export const adminFeatureFlagSchema = z.object({
  feature: z.enum(['rooms', 'games', 'memes']),
  enabled: z.boolean(),
});

/**
 * `POST /api/rooms` — user-created rooms. Unlisted until approved for the
 * lobby; the creator accepts the room rules at creation (logged by storing
 * the accepted copy on the template + a client analytics event).
 */
export const roomCreateSchema = z.object({
  slug: roomSlugSchema
    .refine((s) => s !== 'new', 'That name is reserved')
    .refine((s) => !['admin', 'official', 'public'].includes(s), 'That name is reserved'),
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(280),
  rules: z.array(z.string().trim().min(1).max(140)).min(1).max(6),
  lang: z.string().trim().min(1).max(20).default('en'),
});
