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
