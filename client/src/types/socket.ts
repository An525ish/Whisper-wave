// Re-export the canonical NewMessagePayload from chat types (has chatId + message)
export type { NewMessagePayload } from '@/types/chat';

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
