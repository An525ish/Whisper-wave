/** Reports queue, moderation audit, rooms, bans, panic flags and memes blocklist. */

export type AdminReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'underage'
  | 'impersonation'
  | 'other';

export type AdminReportEvidenceItem = {
  alias: string;
  text: string;
  /** Kept copy of a photo, GIF or meme (photos live until an admin deletes them). */
  media?: { kind: string; url: string };
  ts: number;
  /** The message was hidden when the snapshot was taken. */
  hidden?: boolean;
};

export type AdminReportRow = {
  _id: string;
  reporterAnonId: string | null;
  reporterGid: string | null;
  targetType: 'user' | 'anonSession' | 'roomMessage';
  targetUserId: string | null;
  targetGid: string | null;
  targetAnonId: string | null;
  sessionId: string | null;
  chatId: string | null;
  roomSlug: string | null;
  roomInstanceId: string | null;
  roomMessageId: string | null;
  evidence: AdminReportEvidenceItem[] | null;
  reason: AdminReportReason;
  details: string | null;
  reviewed: boolean;
  reviewedAt: string | null;
  actionNote: string | null;
  retainUntil: string | null;
  createdAt: string;
};

export type AdminReportsPage = {
  reports: AdminReportRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type AdminReportAction = 'ban' | 'hide';
export type AdminBanScope = 'room' | 'global';

export type AdminReportActionInput = {
  id: string;
  action: AdminReportAction;
  scope?: AdminBanScope;
  durationMin?: number;
};

export type AdminReportActionResult = {
  report: AdminReportRow;
  applied: boolean;
  evicted: number;
};

export type AdminReportReviewInput = {
  id: string;
  actionNote: string;
};

export type ReportReviewForm = {
  actionNote: string;
};

/** Report SLA clock readout (see `utils/reports.ts`). */
export type SlaStatus = {
  ageMs: number;
  slaMs: number;
  breached: boolean;
  /** Short human line: `1h 12m old · 48m left (2h SLA)`. */
  label: string;
};

export type ModAuditEntry = {
  _id: string;
  actorKind: 'mod' | 'admin';
  actorLabel: string;
  actorUserId: string | null;
  actorGid: string | null;
  action: string;
  target: string | null;
  roomSlug: string | null;
  instanceId: string | null;
  detail: string | null;
  createdAt: string;
};

export type AdminRoomVisibility = 'official' | 'public' | 'unlisted' | 'private';

/** Admin room-list filter: one visibility, or everything. */
export type AdminRoomFilter = 'all' | AdminRoomVisibility;

export type AdminRoomHours = {
  days: number[];
  start: string;
  end: string;
  tz: string;
};

export type AdminRoomMedia = 'image' | 'gif' | 'meme';

export type AdminRoomMod = { id: string; username: string | null };

export type AdminRoomRow = {
  slug: string;
  title: string;
  description: string;
  rules: string[];
  lang: string;
  official: boolean;
  hours: AdminRoomHours | null;
  capSoft: number;
  capHard: number;
  mods: AdminRoomMod[];
  visibility: AdminRoomVisibility;
  /** Media members may post (guests are always text only). */
  media: AdminRoomMedia[];
  /** Listening room: strict automod, posting only while a mod is seated. */
  requiresModPresence: boolean;
  listingRequestedAt: string | null;
  createdAt: string;
  open: boolean;
  instances: Array<{ n: number; online: number }>;
};

/** `PUT /api/admin/rooms` — rules/hours overwrite when omitted, so always send them. */
export type AdminRoomUpsert = {
  slug: string;
  title: string;
  description: string;
  rules: string[];
  lang: string;
  official: boolean;
  hours: AdminRoomHours | null;
  visibility: AdminRoomVisibility;
  /** Omitted leaves the template's allowed media untouched. */
  media?: AdminRoomMedia[];
  /** Omitted leaves the template's mods untouched. */
  mods?: string[];
  /** Omitted leaves the template's flag untouched. */
  requiresModPresence?: boolean;
};

/** Room edit form values — strings only; `utils/roomForm.ts` maps to `AdminRoomUpsert`. */
export type RoomEditForm = {
  title: string;
  description: string;
  /** One rule per line, up to ten. */
  rulesText: string;
  lang: string;
  official: boolean;
  requiresModPresence: boolean;
  /** Allowed media kinds (checkbox group values). */
  media: string[];
  visibility: AdminRoomVisibility;
  hoursEnabled: boolean;
  /** Weekday numbers 0-6 as strings (checkbox group values). */
  days: string[];
  start: string;
  end: string;
  tz: string;
  /** Comma-separated ObjectIds, pre-filled from the room; blank clears the mods. */
  modsText: string;
};

export type AdminRoomBan = {
  _id: string;
  roomSlug: string | null;
  gid: string | null;
  userId: string | null;
  until: string;
  reason: string;
  by: string;
  createdAt: string;
};

export type AdminRoomBanInput = {
  roomSlug: string | null;
  gid?: string | null;
  userId?: string | null;
  minutes: number;
  reason: string;
};

export type AdminRoomBanResult = {
  ban: AdminRoomBan;
  evicted: number;
};

/** Server kill-switch keys; the panic card surfaces `PANIC_FEATURES` only. */
export type AdminFeatureFlag = 'rooms' | 'games' | 'memes' | 'privateRooms';

export type AdminMemeBlockItem = {
  id: number;
  reports: number;
  blocked: boolean;
  reason?: string;
  updatedAt: string;
};

export type AdminMemeBlocklist = {
  ids: number[];
  items: AdminMemeBlockItem[];
};

export type MemeBlockForm = {
  id: string;
};

/** Server envelope for admin moderation endpoints: payload under `data`. */
export type AdminApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};
