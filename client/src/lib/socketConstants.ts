export const NEW_MESSAGE = 'NEW_MESSAGE' as const;
export const NEW_MESSAGE_ALERT = 'NEW_MESSAGE_ALERT' as const;
export const ALERT = 'ALERT' as const;
export const REFETCH_CHATS = 'REFETCH_CHATS' as const;
export const NEW_ATTACHMENT = 'NEW_ATTACHMENT' as const;
export const NEW_REQUEST = 'NEW_REQUEST' as const;
export const START_TYPING = 'START_TYPING' as const;
export const STOP_TYPING = 'STOP_TYPING' as const;

export type SocketEventName =
  | typeof NEW_MESSAGE
  | typeof NEW_MESSAGE_ALERT
  | typeof ALERT
  | typeof REFETCH_CHATS
  | typeof NEW_ATTACHMENT
  | typeof NEW_REQUEST
  | typeof START_TYPING
  | typeof STOP_TYPING;
