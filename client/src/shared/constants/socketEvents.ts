export const NEW_MESSAGE = 'NEW_MESSAGE' as const;
export const NEW_MESSAGE_ALERT = 'NEW_MESSAGE_ALERT' as const;
export const ALERT = 'ALERT' as const;
export const REFETCH_CHATS = 'REFETCH_CHATS' as const;
export const NEW_ATTACHMENT = 'NEW_ATTACHMENT' as const;
export const NEW_REQUEST = 'NEW_REQUEST' as const;
export const START_TYPING = 'START_TYPING' as const;
export const STOP_TYPING = 'STOP_TYPING' as const;
export const CHAT_READ = 'CHAT_READ' as const;
export const MESSAGE_UPDATED = 'MESSAGE_UPDATED' as const;
export const MESSAGES_DELETED = 'MESSAGES_DELETED' as const;
export const CHAT_CLEARED = 'CHAT_CLEARED' as const;
export const ONLINE_USERS = 'ONLINE_USERS' as const;
export const USER_ONLINE = 'USER_ONLINE' as const;
export const USER_OFFLINE = 'USER_OFFLINE' as const;

export type SocketEventName =
  | typeof NEW_MESSAGE
  | typeof NEW_MESSAGE_ALERT
  | typeof ALERT
  | typeof REFETCH_CHATS
  | typeof NEW_ATTACHMENT
  | typeof NEW_REQUEST
  | typeof START_TYPING
  | typeof STOP_TYPING
  | typeof CHAT_READ
  | typeof MESSAGE_UPDATED
  | typeof MESSAGES_DELETED
  | typeof CHAT_CLEARED
  | typeof ONLINE_USERS
  | typeof USER_ONLINE
  | typeof USER_OFFLINE;
