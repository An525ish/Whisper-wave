/** HTTP request/response shapes for the whisper endpoints. Types only. */

import type { REPORT_REASONS } from '../constants';
import type { Gender, VibeTag } from './core';

export type JoinQueuePayload = {
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;
  /** 18+ attestation. Required — anonymous chat is not for minors. */
  ageConfirmed: boolean;
};

/** `POST /match/join` only saves the identity card; the socket does the queueing. */
export type JoinQueueResponse = {
  success: boolean;
  data: {
    status: 'waiting';
  };
};

export type ReportReason = (typeof REPORT_REASONS)[number]['value'];

export type SubmitReportPayload = {
  sessionId: string;
  reason: ReportReason;
  details?: string;
};

export type CompleteConnectionResponse = {
  success: boolean;
  data:
    | {
        status: 'connected';
        chatId: string;
        connectionId: string;
        originNames: [string, string];
        originVibeTags: [VibeTag[], VibeTag[]];
      }
    | {
        status: 'waiting_for_partner';
        chatId: '';
        connectionId: '';
        originNames: [string, string];
        originVibeTags: [VibeTag[], VibeTag[]];
      };
};

/** One row of `GET /api/connection/pending`. Copy stays neutral server-side. */
export type PendingConnectionItem = {
  /** `claim:<sessionId>` (redeemable by me) or `pending:<sessionId>` (waiting for them). */
  id: string;
  sessionId: string;
  origin: { partnerAlias: string; tags: VibeTag[] };
  /** ISO timestamp when this item expires. */
  expiresAt: string;
  state: 'action_needed' | 'waiting_for_partner';
};

export type PendingListResponse = {
  success: boolean;
  data: { items: PendingConnectionItem[] };
};

/** `GET /api/match/quota` — members only; guests are never capped. */
export type WhisperQuotaResponse = {
  success: boolean;
  data: { limit: number; remaining: number };
};

/** The "how we met" story for a DM that began as an anonymous match. */
export type ConnectionOrigin = {
  connectionId: string;
  chatId: string;
  originNames: [string, string];
  originVibeTags: [VibeTag[], VibeTag[]];
  connectedAt: string | null;
  /** Which of the two origin entries belongs to the requesting user. */
  selfIndex: 0 | 1;
  selfAlias: string;
  partnerAlias: string;
  selfVibes: VibeTag[];
  partnerVibes: VibeTag[];
  partnerName: string;
  partnerUsername?: string;
  partnerAvatar?: string;
};
