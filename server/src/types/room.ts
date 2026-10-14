import type { Types } from 'mongoose';
import type { ModAuditFields } from './roomAdmin.js';

/** Who may see and join a room template. */
export type RoomVisibility = 'official' | 'public' | 'unlisted' | 'private';

/** Lobby state of a template: hours decide `closed`; a listening room with no mod is `waiting_mod`. */
export type RoomStatus = 'open' | 'closed' | 'waiting_mod';

/** Powers inside a room. Official rooms are mod-run; user rooms are host-run. */
export type RoomRole = 'member' | 'mod' | 'host' | 'admin';

/** Weekly open hours in a named timezone. Absent means always open. */
export type RoomHours = {
  /** 0 = Sunday … 6 = Saturday, evaluated in `tz`. */
  days: number[];
  /** 'HH:MM' 24 h — when the room opens. */
  start: string;
  /** 'HH:MM' 24 h — when it closes. Earlier than `start` means overnight. */
  end: string;
  /** IANA zone, e.g. 'Asia/Kolkata'. */
  tz: string;
};

export type IRoomFields = {
  slug: string;
  title: string;
  description: string;
  /** Shown on the pre-join sheet. Accepted at creation for user rooms. */
  rules: string[];
  /** Language tag, e.g. 'en', 'hinglish'. */
  lang: string;
  official: boolean;
  hours?: RoomHours | null;
  /** Soft cap per instance (overflow opens #2), hard cap (never exceeded). */
  capSoft: number;
  capHard: number;
  /** Null for official rooms. */
  createdBy?: Types.ObjectId | null;
  /** Wave Team accounts — granted the mod role on join. */
  mods?: Types.ObjectId[];
  /** Set when the host requests lobby listing (unlisted rooms only). */
  listingRequestedAt?: Date | null;
  visibility: RoomVisibility;
  /** Private rooms only: idle-expiry deadline, pushed out on activity (`services/rooms/lifecycle.ts`). */
  expireAt?: Date | null;
  /** Listening room (Venting): strict automod, and posting only while a mod is seated. Default false. */
  requiresModPresence?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** A ban from one room (`roomSlug`) or every room (`roomSlug: null`). */
export type IRoomBanFields = {
  roomSlug: string | null;
  gid?: string | null;
  userId?: Types.ObjectId | null;
  /** The ban lifts here; TTL index on this field. */
  until: Date;
  reason: string;
  by: string;
  createdAt: Date;
};

/** One identity inside a live room instance. */
export type RoomMemberIdentity = {
  kind: 'guest' | 'member';
  userId?: string;
  gid?: string;
};

/** What the automod needs to judge one message. Pure data — no sockets. */
export type RoomMessageCheck = {
  text: string;
  sender: RoomMemberIdentity;
  /** Links allowed for this sender in this room (guests/new members: never). */
  linksAllowed: boolean;
  /** Slow-mode window for this sender, ms. */
  slowModeMs: number;
  /** ms since this sender's last accepted message (missing = first post). */
  msSinceLastPost?: number;
  /** Their recent accepted texts, newest last (duplicate suppression). */
  recentTexts: string[];
  now: number;
  /** Strict (listening-room) rules; absent = the normal rules. */
  strict?: StrictRoomProfile;
};

/** Data-only tightening applied to listening rooms by the same automod path. */
export type StrictRoomProfile = {
  /** Floor for slow mode, ms — applies to everyone below staff. */
  slowModeMinMs: number;
  /** Links blocked for everyone below staff (trusted members included). */
  blockLinks: boolean;
  /** How many of the sender's recent posts duplicate suppression compares against. */
  duplicateWindow: number;
  maxLength: number;
  /** `@name` mentions refused (no pinging strangers). */
  blockMentions: boolean;
};

export type RoomErrorCode =
  | 'blocked_content'
  | 'blocked_link'
  | 'slow_mode'
  | 'duplicate'
  | 'spam'
  | 'muted'
  | 'mod_absent';

/**
 * Every `code` a `/rooms` ack or `ROOM_ERROR` can carry. The client mirrors
 * this union; codes are the contract, prose never is.
 */
export type RoomAckCode =
  | RoomErrorCode
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

/** Trust ladder (HUB_PLAN §6.2). */
export type TrustLevel = 'new' | 'standard' | 'trusted';

/**
 * First-post challenge handed to a guest (D9). Turnstile when configured; the
 * stateless arithmetic question is the dev/CI fallback.
 */
export type RoomChallenge =
  | { provider: 'turnstile'; siteKey: string }
  | { provider: 'arithmetic'; token: string; prompt: string };

/** What the client sends back with the re-sent message. */
export type RoomChallengeAnswer =
  | { provider: 'turnstile'; token: string }
  | { provider?: 'arithmetic'; token: string; answer: string };

/** Outcome of the challenge gate for one post. */
export type RoomChallengeVerdict =
  | { ok: true }
  | {
      ok: false;
      code: 'challenge_required' | 'challenge_failed' | 'challenge_unavailable' | 'rate_limited';
      challenge?: RoomChallenge;
      retryAfterMs?: number;
    };

/** Result of one Turnstile siteverify call. `unavailable` = network/5xx/timeout (fail closed, retryable). */
export type TurnstileOutcome = 'success' | 'failed' | 'unavailable';

/** Resolved challenge provider settings (Turnstile keys, or the arithmetic fallback). */
export type ChallengeSettings =
  | { provider: 'turnstile'; siteKey: string; secretKey: string }
  | { provider: 'arithmetic' };

export type RoomModVerdict =
  | { allowed: true }
  | { allowed: false; code: RoomErrorCode; retryAfterMs?: number; severe?: boolean; category?: string };

/** One person inside a live room instance. */
export type LiveRoomMember = {
  /** userId for members, gid for guests — unique within the instance. */
  key: string;
  alias: string;
  color: string;
  role: RoomRole;
  userId?: string;
  gid?: string;
  /** Resolved once at join — rooms stay Mongo-free on the hot path. */
  trust?: TrustLevel;
  joinedAt: number;
  /** Last accepted post — slow mode reads this, not a separate store. */
  lastPostAt?: number;
};

/** One message in an instance's ring buffer. */
export type LiveRoomMessage = {
  id: string;
  alias: string;
  color: string;
  role: RoomRole;
  text: string;
  ts: number;
  /**
   * Offender identity, SERVER-ONLY: resolves a report to a ban target. Never
   * put these in a client-bound payload — `toWireMessage` is the only mapper.
   */
  senderGid: string;
  senderUserId?: string;
  replyTo?: string;
  /** Wave bot prompts. Rendered distinctly, never counted as a person. */
  system?: boolean;
  /** Mod-removed or auto-hidden: excluded from history, never deleted. */
  hidden?: boolean;
  /** reaction → member keys holding it (toggle state). */
  reactions?: Record<string, string[]>;
};

/** One live instance — in-process only, see `services/rooms/store.ts`. */
export type RoomInstance = {
  id: string;
  slug: string;
  title: string;
  capSoft: number;
  capHard: number;
  /** Locked rooms refuse new member joins (mods/hosts always pass). */
  locked: boolean;
  /** Mirrors the template flag (refreshed on every join) — the post gate stays Mongo-free. */
  requiresModPresence?: boolean;
  /** Per-instance slow-mode override (ms). Falls back to role defaults. */
  slowOverrideMs?: number;
  members: Map<string, LiveRoomMember>;
  ring: LiveRoomMessage[];
  createdAt: number;
};

/** One evidence line (alias/text/ts only — never an identity or IP). */
export type RoomEvidenceLine = {
  id: string;
  alias: string;
  text: string;
  ts: number;
  hidden?: boolean;
};

/** A reported message plus neighbours, from the RAW ring (hidden included). */
export type RoomEvidenceWindow = {
  items: RoomEvidenceLine[];
  /** The raw target, incl. senderGid/senderUserId — server use only. */
  target: LiveRoomMessage | null;
};

/** Client-bound message shape. Carries no sender identity. */
export type WireRoomMessage = {
  id: string;
  from: { alias: string; color: string; role: RoomRole };
  text: string;
  ts: number;
  replyTo?: string;
  system?: boolean;
  /** Mods only: the message is hidden for everyone else. */
  hidden?: boolean;
};

/** `ROOM_JOIN` payload (after Zod). */
export type RoomJoinInput = { slug: string; alias: string; color?: string; invite?: string };

/** `ROOM_MESSAGE` payload. `id` is the sender's optimistic id, echoed as `clientId`. */
export type RoomMessageInput = {
  id?: string;
  text: string;
  replyTo?: string;
  challenge?: RoomChallengeAnswer;
};

/** `ROOM_REACT` payload. */
export type RoomReactInput = { messageId: string; reaction: string };

export type RoomModAction =
  | 'delete'
  | 'unhide'
  | 'mute'
  | 'kick'
  | 'lock'
  | 'unlock'
  | 'slow'
  | 'shadowmute';

/** Who is acting, for the audit trail (the action itself is added per call). */
export type RoomModActor = Omit<ModAuditFields, 'action' | 'createdAt'>;

/** `ROOM_MOD` payload. */
export type RoomModInput = {
  action: RoomModAction;
  messageId?: string;
  target?: string;
  minutes?: number;
  ms?: number;
};

export type PostRoomMessageInput = {
  instanceId: string;
  identity: RoomMemberIdentity;
  text: string;
  replyTo?: string;
  challenge?: RoomChallengeAnswer;
};

export type PostRoomMessageResult =
  | {
      message: LiveRoomMessage;
      /** Rendered for the sender only — nobody else ever sees it. */
      shadowed?: boolean;
      /** Self-harm language detected: show the resources card, never auto-ban. */
      support?: boolean;
    }
  | {
      ok: false;
      code: RoomErrorCode | 'rate_limited' | 'challenge_required' | 'challenge_failed' | 'challenge_unavailable';
      retryAfterMs?: number;
      challenge?: RoomChallenge;
      /** Self-harm language detected: show the resources card, never auto-ban. */
      support?: boolean;
    };

/** Extended Socket type for the `/rooms` namespace. */
export type RoomSocket = import('socket.io').Socket & {
  /** Stable guest id — required on `/rooms`, enforced at handshake. */
  gid: string;
  /** Signed-in account, when the `accessToken` cookie verified. */
  userId?: string;
  /** Anonymous session id, when present (block mirroring, quota context). */
  anonId?: string;
  /** Instance this socket is currently in, if any. */
  roomInstanceId?: string;
  /** A ROOM_JOIN is mid-flight — joins serialise per socket. */
  roomJoinPending?: boolean;
};
