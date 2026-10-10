import type { Document, Types } from 'mongoose';
import type { VibeTag } from './match.js';

/**
 * One seat of an anonymous session awaiting account binding. `sides[0]` is the
 * session's `anon1` seat, `sides[1]` is `anon2` (the same index the connect
 * token's `side` carries) — no anonId is stored; those live only in Redis.
 */
export type PendingConnectionSideDoc = {
  userId: Types.ObjectId | null;
  displayName: string;
  vibeTags: VibeTag[];
};

export type PendingConnectionStatusDoc = 'pending' | 'processing' | 'completed' | 'expired';

export type IPendingConnectionDocFields = {
  sessionId: string;
  sides: [PendingConnectionSideDoc, PendingConnectionSideDoc];
  status: PendingConnectionStatusDoc;
  /** When the current 'processing' claim was taken; lets stale claims be re-taken. */
  processingAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type IPendingConnection = IPendingConnectionDocFields & Document;

/** Lean shape of a Connection document. */
export type ConnectionLean = {
  _id: Types.ObjectId;
  users: Types.ObjectId[];
  pairKey: string;
  chat: Types.ObjectId;
  originAnonSession: string;
  originNames: [string, string];
  originVibeTags: [VibeTag[], VibeTag[]];
  connectedAt: Date;
  createdAt: Date;
};

export type CreateConnectionInput = {
  users: [Types.ObjectId | string, Types.ObjectId | string];
  chatId: Types.ObjectId | string;
  originAnonSession: string;
  originNames: [string, string];
  originVibeTags: [VibeTag[], VibeTag[]];
};

export type CompleteConnectionResult = {
  chatId: string;
  connectionId: string;
  status: 'connected' | 'waiting_for_partner';
  originNames: [string, string];
  originVibeTags: [VibeTag[], VibeTag[]];
};

/** What the controller needs to tell both parties a DM now exists. */
export type ConnectionAnnouncement = {
  chatId: string;
  connectionId: string;
  anonIds: string[];
  userIds: [string, string];
};

export type CompleteConnectionOutcome = {
  result: CompleteConnectionResult;
  /** Null unless this call actually completed (or re-completed) the connection. */
  announce: ConnectionAnnouncement | null;
};

/**
 * One row of `GET /api/connection/pending` — something this account still
 * owes a whisper connection, or is owed. Copy stays neutral: the client never
 * learns whether the other side has an account.
 */
export type PendingConnectionItem = {
  /** `claim:<sessionId>` (redeemable by me) or `pending:<sessionId>` (waiting for them). */
  id: string;
  sessionId: string;
  origin: { partnerAlias: string; tags: VibeTag[] };
  /** ISO timestamp when this item expires. */
  expiresAt: string;
  state: 'action_needed' | 'waiting_for_partner';
};
