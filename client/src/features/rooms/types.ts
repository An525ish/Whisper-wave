import type { ReactNode } from 'react';
import type { z } from 'zod';
import type { ROOM_REACTION_GLYPHS } from './constants';
import type { RoomChallenge, RoomChallengeAnswer } from './types/challenge';
import type { createRoomSchema, editRoomFormSchema, roomAliasSchema } from './utils/roomValidators';

// ── Lobby / room info ──

/** Weekly open hours in a named zone: days 0 = Sunday … 6, 'HH:MM' 24 h, IANA tz. */
export type RoomHours = { days: number[]; start: string; end: string; tz: string };

/** Lobby state: hours close a room; a listening room with no moderator is `waiting_mod` (joinable, not postable). */
export type RoomStatus = 'open' | 'closed' | 'waiting_mod';

/** One lobby row: template plus live occupancy. Quiet rooms list nothing. */
export type RoomSummary = {
  slug: string;
  title: string;
  description: string;
  lang: string;
  official: boolean;
  /** Compatibility only (`status === 'open'`) — read `status`. */
  open: boolean;
  status: RoomStatus;
  /** Listening room: strict rules and the "not a crisis service" strip. */
  requiresModPresence: boolean;
  hours: RoomHours | null;
  instances: Array<{ n: number; online: number }>;
  totalOnline: number;
};

/** Mirrors the server's `RoomVisibility`. Only the info sheet carries it (and only with proof). */
export type RoomVisibility = 'official' | 'public' | 'unlisted' | 'private';

export type RoomInfo = RoomSummary & {
  rules: string[];
  visibility: RoomVisibility;
};

/** What the create sheet may offer. `public` = the server decides listed vs unlisted. */
export type CreateRoomVisibility = 'public' | 'private';

/** One of my own rooms (`GET /api/rooms/mine`). */
export type MyRoom = {
  slug: string;
  title: string;
  visibility: RoomVisibility;
  status: 'open' | 'closed' | 'waiting_mod';
};

/** Why private creation is (not) available — drives the create sheet's states. */
export type PrivateRoomEligibility = 'ok' | 'flag_off' | 'not_entitled';

export type MyRoomsResponse = {
  success: boolean;
  data: {
    rooms: MyRoom[];
    privateRooms: { eligibility: PrivateRoomEligibility; active: number; limit: number };
  };
};

export type MyRoomsData = MyRoomsResponse['data'];

/** Terms for a new invite link. Private rooms require `maxUses`. */
export type RoomInviteTerms = { maxUses: number | null; ttlDays: number };

export type RoomsFilter = 'all' | 'open' | 'live' | 'later';

export type RoomsListResponse = {
  success: boolean;
  data: { rooms: RoomSummary[] };
};

export type RoomInfoResponse = {
  success: boolean;
  data: { room: RoomInfo };
};

export type CreateRoomResponse = {
  success: boolean;
  data: { room: RoomInfo };
};

// ── Live thread ──

export type RoomRole = 'member' | 'mod' | 'host' | 'admin';

/** Who sent a message — and, for `ROOM_STATE.you`, who I am. */
export type RoomMessageFrom = {
  alias: string;
  color: string;
  role: RoomRole;
};

export type RoomYou = RoomMessageFrom;

/** One thread message, as carried on the socket and in the store. */
export type RoomMessage = {
  id: string;
  from: RoomMessageFrom;
  text: string;
  ts: number;
  replyTo?: string;
  reactions?: Record<string, number>;
  /** Wave bot prompts — centered, muted, never counted as a person. */
  system?: boolean;
  /** Mods only: removed or auto-hidden — shown greyed with an Unhide action. */
  hidden?: boolean;
};

/** Reaction KEY the wire carries (`heart` …); glyphs are display only. */
export type RoomReactionKey = keyof typeof ROOM_REACTION_GLYPHS;

export type RoomJoinParams = {
  alias: string;
  color: string;
  invite?: string;
};

export type RoomJoinStatus = 'idle' | 'joining' | 'joined' | 'rejoining';

export type RoomSocketStatus = 'connecting' | 'online' | 'offline';

// ── Wire contracts (mirror server/src/types/room.ts) ──

/** Every `code` a `/rooms` ack or `ROOM_ERROR` can carry. */
export type RoomAckCode =
  | 'blocked_content'
  | 'blocked_link'
  | 'slow_mode'
  | 'duplicate'
  | 'spam'
  | 'muted'
  | 'mod_absent'
  | 'feature_off'
  | 'identity_required'
  | 'members_only'
  | 'not_found'
  | 'closed'
  | 'banned'
  | 'not_joined'
  | 'rate_limited'
  | 'locked'
  | 'forbidden'
  | 'invalid_payload'
  | 'alias_invalid'
  | 'join_in_progress'
  | 'challenge_required'
  | 'challenge_failed'
  | 'challenge_unavailable'
  | 'unknown';

/** `ROOM_STATE` — sent to a socket after it is seated. */
export type RoomStatePayload = {
  roomId: string;
  instance: number;
  slug: string;
  title: string;
  rules: string[];
  recent: RoomMessage[];
  online: number;
  you: RoomYou;
  /** Listening rooms only: the strip shows, and `paused` says nobody is moderating right now. */
  requiresModPresence?: boolean;
  paused?: boolean;
};

/** One crisis line on the support card. */
export type RoomHelpline = { name: string; contact: string; href: string };

export type RoomJoinAck = { ok: true; roomId: string } | { ok: false; code: RoomAckCode };

export type RoomMessageAck =
  | { ok: true; id: string; support?: boolean; clientId?: string }
  | {
      ok: false;
      code: RoomAckCode;
      retryAfterMs?: number;
      challenge?: RoomChallenge;
      support?: boolean;
      clientId?: string;
    };

/** Ack for react / mod / leave. */
export type RoomActionAck = { ok: true } | { ok: false; code: RoomAckCode };

export type RoomMessageInput = {
  id: string;
  text: string;
  replyTo?: string;
  challenge?: RoomChallengeAnswer;
};

/** A moderation action, as sent over `ROOM_MOD`. */
export type RoomModAction = {
  action: 'delete' | 'unhide' | 'mute' | 'kick' | 'lock' | 'unlock' | 'slow' | 'shadowmute';
  messageId?: string;
  target?: string;
  minutes?: number;
  ms?: number;
};

/** `ROOM_MOD_ACTION` — what the server announces (room-wide or to the target). */
export type RoomModNotice =
  | { action: 'delete'; messageId: string }
  | { action: 'unhide'; messageId: string; message: RoomMessage }
  | { action: 'locked' | 'unlocked' }
  | { action: 'slow'; ms: number }
  | { action: 'kick'; targetAlias: string }
  | { action: 'muted'; minutes: number }
  | { action: 'kicked' }
  | { action: 'banned' };

export type RoomReactionPayload = { messageId: string; reaction: string; count: number };

// ── Full-page end states ──

export type RoomEndKind =
  | 'kicked'
  | 'banned'
  | 'closed'
  | 'not_found'
  | 'switched_off'
  | 'restarted'
  | 'identity_required';

export type RoomEndState = {
  kind: RoomEndKind;
  /** Admin-written prose from `ROOM_CLOSED`, when the server sent one. */
  detail?: string;
};

// ── Composer ──

export type RoomReplyPreview = { id: string; alias: string; preview: string };

// ── Message menu ──

export type RoomMenuItem = {
  id: string;
  label: string;
  icon: ReactNode;
  danger?: boolean;
  run: () => void;
};

// ── Invites / persona / forms ──

export type RoomInvite = {
  id: string;
  maxUses: number | null;
  uses: number;
  expiresAt: string;
  revoked: boolean;
  createdAt: string;
};

/** An invite plus its precomputed "N left" label (computed outside render). */
export type RoomInviteRow = RoomInvite & { expiry: string };

export type RoomsPersona = {
  alias: string;
  color: string;
};

export type RoomAliasForm = z.infer<typeof roomAliasSchema>;

export type CreateRoomForm = z.infer<typeof createRoomSchema>;

export type EditRoomForm = z.infer<typeof editRoomFormSchema>;

export type CreateRoomPayload = {
  slug: string;
  title: string;
  description: string;
  rules: string[];
  lang: string;
  /** The host-rules checkbox — the server refuses creation without it. */
  rulesAccepted: true;
  visibility: CreateRoomVisibility;
};

export type RoomContentPayload = { title: string; description: string; rules: string[] };

export type RoomReportPayload = { messageId: string; reason: string; details?: string };

// ── Store ──

export type RoomStore = {
  instanceId: string | null;
  slug: string | null;
  title: string;
  rules: string[];
  messages: RoomMessage[];
  online: number;
  you: RoomYou | null;
  socketStatus: RoomSocketStatus;
  joinStatus: RoomJoinStatus;
  /** Kept for the whole visit so a dropped socket can re-emit `ROOM_JOIN`. */
  joinParams: RoomJoinParams | null;
  /** Why the last join was refused — shown inline on the rules sheet. */
  joinError: RoomAckCode | null;
  /** A full-page ending (kicked, closed, switched off …); null while alive. */
  endState: RoomEndState | null;
  /** I am muted until this epoch ms (server notice); null when not. */
  mutedUntil: number | null;
  /** Self-harm language seen in my post — show the resources card once. */
  supportNotice: boolean;
  /** Listening room (strict rules + safety strip). */
  listening: boolean;
  /** Listening room with no moderator: reading only, composer disabled. */
  paused: boolean;
  /** messageId → reaction keys I hold on it (toggle state mirrors the server). */
  myReactions: Record<string, RoomReactionKey[]>;
  applyState: (state: RoomStatePayload) => void;
  appendMessage: (message: RoomMessage) => void;
  appendNotice: (text: string) => void;
  applyReaction: (messageId: string, reaction: string, count: number) => void;
  toggleMine: (messageId: string, reaction: RoomReactionKey) => void;
  deleteMessage: (messageId: string) => void;
  restoreMessage: (message: RoomMessage) => void;
  setPresence: (online: number) => void;
  setSocketStatus: (status: RoomSocketStatus) => void;
  beginJoin: (params: RoomJoinParams) => void;
  joinFailed: (code: RoomAckCode) => void;
  markRejoining: () => void;
  setEnd: (end: RoomEndState, opts?: { keepParams?: boolean }) => void;
  clearEnd: () => void;
  setMutedUntil: (until: number | null) => void;
  setPaused: (paused: boolean) => void;
  setSupportNotice: () => void;
  clearSupportNotice: () => void;
  reset: () => void;
};

/** What a closed room's reminder button should be and do (see `useRoomReminderControls`). */
export type RoomReminderControl = {
  kind: 'remind' | 'on' | 'enable';
  pending: boolean;
  onClick: () => void;
};
