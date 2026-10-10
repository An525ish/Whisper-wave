/**
 * Chat feature — public API. External code imports from `@/features/chat`;
 * internal files use relative imports.
 */
export { default as AddMemberDialog } from './components/dialogs/AddMemberDialog';
export { default as ConversationHeader } from './components/conversation/header/ConversationHeader';
export { default as ChatListPanel } from './components/list/ChatListPanel';
export { default as MessageSearch } from './components/conversation/search/MessageSearch';
export { default as ConversationPanel } from './components/conversation/ConversationPanel';
export type { ConversationPanelHandle } from './components/conversation/ConversationPanel';
export { default as LinkPreviewThumb } from './components/link/LinkPreviewThumb';
export { default as OlderMessagesLoader } from './components/conversation/OlderMessagesLoader';
export { default as ImageViewerReplyBar } from './components/ImageViewerReplyBar';

export { CHAT_HEADER_FADE_CLASS } from './constants/chat';
export { usePresenceStore } from './stores/presence';
export type { ChatsResponse } from './types/chat';
export * from './hooks';
