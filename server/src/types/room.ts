import type { Types } from 'mongoose';

/** Who may see and join a room template. */
export type RoomVisibility = 'official' | 'public' | 'unlisted';

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
};

export type RoomErrorCode =
  | 'blocked_content'
  | 'blocked_link'
  | 'slow_mode'
  | 'duplicate'
  | 'spam'
  | 'muted';

export type RoomModVerdict =
  | { allowed: true }
  | { allowed: false; code: RoomErrorCode; retryAfterMs?: number; severe?: boolean };

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
  trust?: 'new' | 'standard' | 'trusted';
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
  replyTo?: string;
  /** Wave bot prompts. Rendered distinctly, never counted as a person. */
  system?: boolean;
  /** Mod-removed or auto-hidden: excluded from history, never deleted. */
  hidden?: boolean;
  /** reaction → member keys holding it (toggle state). */
  reactions?: Record<string, string[]>;
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
};
