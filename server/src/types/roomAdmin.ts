import type { Types } from 'mongoose';
import type { IRoomFields, RoomStatus } from './room.js';
import type { IReportFields } from './report.js';

export type LobbyRoom = {
  slug: string;
  title: string;
  description: string;
  lang: string;
  official: boolean;
  /** Compatibility: `status === 'open'`. */
  open: boolean;
  status: RoomStatus;
  /** Listening room — the client shows the "not a crisis service" strip. */
  requiresModPresence: boolean;
  hours: IRoomFields['hours'];
  /** Instances with anyone in them — quiet rooms list nothing (honest counts). */
  instances: Array<{ n: number; online: number }>;
  totalOnline: number;
};

/** One of the caller's own rooms (`GET /api/rooms/mine`). */
export type MyRoom = {
  slug: string;
  title: string;
  visibility: IRoomFields['visibility'];
  status: RoomStatus;
};

/** A room's mod as shown in the admin listing; `username` is null if the account no longer exists. */
export type AdminRoomMod = { id: string; username: string | null };

export type CreateUserRoomInput = {
  slug: string;
  title: string;
  description: string;
  rules: string[];
  lang: string;
  userId: string;
  /** What the creator asked for; the server decides listed vs unlisted for `public`. */
  visibility?: 'public' | 'private';
};

/** Rules-acceptance record stored on user-created rooms (D4). */
export type RoomAcceptanceFields = {
  rulesAcceptedAt?: Date | null;
  rulesAcceptedBy?: Types.ObjectId | null;
  rulesVersion?: number | null;
};

export type IRoomInviteFields = {
  roomSlug: string;
  /** SHA-256 of the token — the plaintext is shown once at creation. */
  tokenHash: string;
  createdBy: Types.ObjectId;
  /** Null means unlimited. */
  maxUses: number | null;
  uses: number;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
};

export type ModAuditFields = {
  actorKind: 'mod' | 'admin';
  /** Alias in-room, or 'admin'. Never an anonId beyond what reporters hold. */
  actorLabel: string;
  actorUserId?: string | null;
  actorGid?: string | null;
  /** delete | mute | kick | shadowmute | lock | unlock | slow | ban | unban | close | feature | report-ban | report-hide */
  action: string;
  target?: string | null;
  roomSlug?: string | null;
  instanceId?: string | null;
  detail?: string | null;
  createdAt: Date;
};

/** The offender behind a live message, resolved server-side for evidence. */
export type EvidenceTarget = {
  id: string;
  senderGid: string;
  senderUserId?: string;
};

/** Outcome of an admin report action; `evict` tells the controller who to remove live. */
export type ReportActionResult = {
  report: IReportFields & { _id: Types.ObjectId };
  /** False when a `hide` found the message already gone from the live ring. */
  applied: boolean;
  evict?: { gid?: string; userId?: string; slug?: string };
  audit: { action: string; target: string | null; roomSlug: string | null; detail: string };
};
