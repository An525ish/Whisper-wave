// NewMessagePayload (chatId + ChatMessage) is a chat-domain type and lives in
// features/chat/types/chat.ts; consumers import it from there directly.

export type NewMessageAlertPayload = {
  chatId: string;
};

export type OnlineUsersPayload = {
  userIds: string[];
};

export type UserPresencePayload = {
  userId: string;
  lastSeen?: string;
};

export type TypingPayload = {
  chatId: string;
};

// ── /anon namespace (anonymous matchmaking) ────────────────────────────────

/** Client → server ack shape for `ANON_MESSAGE`. */
export type AnonMessageAck = {
  ok: boolean;
  /** Echoes the client-supplied idempotency key so the bubble can be settled. */
  id?: string;
  reason?: string;
};

export type BufferedAnonMessage = {
  id?: string;
  from: string;
  content: string;
  sentAt: number;
};

export type MatchFoundPayload = {
  sessionId: string;
  partner: { displayName: string; vibeTags: string[] };
  bufferedMessages: BufferedAnonMessage[];
};

export type QueueJoinedPayload = {
  position?: string;
  /** How many people are waiting — powers honest empty-queue copy. */
  queueSize?: number;
};

export type MatchMessagePayload = BufferedAnonMessage;
