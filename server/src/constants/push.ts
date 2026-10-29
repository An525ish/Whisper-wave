export const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
export const FCM_SEND_URL = (projectId: string): string =>
  `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`;

/** Max registered devices per user; the oldest `lastSeenAt` is evicted first. */
export const MAX_PUSH_DEVICES_PER_USER = 10;
/** Devices unseen this long are dropped by a Mongo TTL index. */
export const PUSH_DEVICE_TTL_SECONDS = 60 * 24 * 60 * 60;
/** At most one push per (userId, tag) inside this window. */
export const PUSH_THROTTLE_MS = 30_000;
/** Parallel FCM requests during a fan-out. */
export const PUSH_CONCURRENCY = 5;
export const PUSH_TTL_SECONDS = '3600';
export const PUSH_USER_AGENT_MAX = 200;

export const PUSH_TAG_REQUEST = 'request';
export const PUSH_TAG_CONNECTION = 'connection';
export const pushChatTag = (chatId: string): string => `chat-${chatId}`;

/** Client routes (client/src/shared/constants/routes.ts). Requests live in the chats list. */
export const PUSH_URL_CHATS = '/chats';
export const pushChatUrl = (chatId: string): string => `/chats/${chatId}`;

export const PUSH_BODY_MESSAGE = 'New message';
export const PUSH_BODY_ATTACHMENT = 'Sent an attachment';
export const PUSH_BODY_FORWARD = 'Forwarded a message';
export const PUSH_TITLE_REQUEST = 'New friend request';
export const PUSH_TITLE_CONNECTION = 'Connection saved';
