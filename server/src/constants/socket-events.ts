export const NEW_MESSAGE = 'NEW_MESSAGE';
export const NEW_MESSAGE_ALERT = 'NEW_MESSAGE_ALERT';
export const MESSAGE_UPDATED = 'MESSAGE_UPDATED';
export const MESSAGES_DELETED = 'MESSAGES_DELETED';
export const CHAT_CLEARED = 'CHAT_CLEARED';
export const REFETCH_CHATS = 'REFETCH_CHATS';
export const NEW_ATTACHMENT = 'NEW_ATTACHMENT';
export const NEW_REQUEST = 'NEW_REQUEST';
export const START_TYPING = 'START_TYPING';
export const STOP_TYPING = 'STOP_TYPING';
export const CHAT_READ = 'CHAT_READ';
export const ONLINE_USERS = 'ONLINE_USERS';
export const USER_ONLINE = 'USER_ONLINE';
export const USER_OFFLINE = 'USER_OFFLINE';
export const MESSAGE_REACTION = 'MESSAGE_REACTION';
// A Whisper anonymous match was upgraded to a real DM — sent to both users
// on the authenticated namespace so a partner who already navigated away
// (e.g. signed in from the mutual-vibe screen) still lands in the new chat.
export const WHISPER_CONNECTION_READY = 'WHISPER_CONNECTION_READY';
