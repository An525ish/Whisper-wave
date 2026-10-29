/**
 * Chat feature — public API. External code imports from `@/features/chat`;
 * internal files use relative imports.
 */
export { default as ForwardDialog } from './components/dialogs/ForwardDialog';
export { default as AddMemberDialog } from './components/dialogs/AddMemberDialog';
export { default as ConversationHeader } from './components/conversation/header/ConversationHeader';
export { default as GuestChatsEmpty } from './components/GuestChatsEmpty';
export { default as ChatListPanel } from './components/list/ChatListPanel';
export { default as MessageSearch } from './components/conversation/search/MessageSearch';
export { default as ConversationPanel } from './components/conversation/ConversationPanel';
export type { ConversationPanelHandle } from './types/chat';
export { default as LinkPreviewThumb } from './components/link/LinkPreviewThumb';
export { default as OlderMessagesLoader } from './components/conversation/OlderMessagesLoader';
export { default as ChatInput } from './components/conversation/composer/ChatInput';
export type { MediaKind } from './constants/upload';
export { default as ImageViewerReplyBar } from './components/ImageViewerReplyBar';

export { CHAT_HEADER_FADE_CLASS } from './constants/chat';
export { usePresenceStore } from './stores/presence';
export * from './hooks';
export { default as RenderAttachments } from './components/message/RenderAttachments';
export { default as ReactionStrip, REACTION_SURFACE_CLASS, placeReactionStrip } from './components/message/ReactionStrip';
export { splitTextByUrls, extractLinksFromText, isLinkOnlyMessage } from './utils/linkParser';
export { default as LinkPreview } from './components/message/LinkPreview';
export {
  MESSAGE_ROW_GAP,
  META_ROW_CLASS,
  MEDIA_TIME_CLASS,
  bubblePadding,
} from './constants/messageStyle';
