export const SOCKET_EVENTS = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  NEW_MESSAGE_ALERT: 'NEW_MESSAGE_ALERT',
  REFETCH_CHATS: 'REFETCH_CHATS',
  NEW_ATTACHMENT: 'NEW_ATTACHMENT',
  NEW_REQUEST: 'NEW_REQUEST',
  START_TYPING: 'START_TYPING',
  STOP_TYPING: 'STOP_TYPING',
  CHAT_READ: 'CHAT_READ',
  MESSAGE_UPDATED: 'MESSAGE_UPDATED',
  MESSAGES_DELETED: 'MESSAGES_DELETED',
  CHAT_CLEARED: 'CHAT_CLEARED',
  ONLINE_USERS: 'ONLINE_USERS',
  USER_ONLINE: 'USER_ONLINE',
  USER_OFFLINE: 'USER_OFFLINE',
  MESSAGE_REACTION: 'MESSAGE_REACTION',
  WHISPER_CONNECTION_READY: 'WHISPER_CONNECTION_READY',
} as const

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS]

/**
 * Socket.IO built-in lifecycle events. Used by sockets that cannot sit behind the
 * shared `SocketProvider` (the guest `/anon` namespace connects without an
 * account), so their names are centralised here rather than typed inline.
 */
export const SOCKET_LIFECYCLE = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
} as const
