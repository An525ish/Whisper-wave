/** One lobby row: template plus live occupancy. Quiet rooms list nothing. */
export type RoomSummary = {
  slug: string;
  title: string;
  description: string;
  lang: string;
  official: boolean;
  open: boolean;
  hours: { days: number[]; start: string; end: string; tz: string } | null;
  instances: Array<{ n: number; online: number }>;
  totalOnline: number;
};

export type RoomInfo = RoomSummary & {
  rules: string[];
};

export type RoomRole = 'member' | 'mod' | 'host' | 'admin';

export type RoomMessageFrom = {
  alias: string;
  color: string;
  role: RoomRole;
};

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
};

export type RoomYou = {
  alias: string;
  color: string;
  role: RoomRole;
};

export type RoomInvite = {
  id: string;
  maxUses: number | null;
  uses: number;
  expiresAt: string;
  revoked: boolean;
  createdAt: string;
};

/** A moderation action, as sent over `ROOM_MOD`. */
export type RoomModAction = {
  action: 'delete' | 'mute' | 'kick' | 'lock' | 'unlock' | 'slow' | 'shadowmute';
  messageId?: string;
  target?: string;
  minutes?: number;
  ms?: number;
};

export type CreateRoomPayload = {
  slug: string;
  title: string;
  description: string;
  rules: string[];
  lang: string;
};

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
