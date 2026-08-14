// Shared types for the chat feature (non-hook, non-store)

export type ChatCopyPayload = {
  text: string;
  files: File[];
};

import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import type { Avatar, User } from '@/shared/types';
import type { ContextMenuState } from '@/shared/types';

// --- Attachment & media ---
export type ChatAttachment = {
  url?: string;
  tempUrl?: string;
  name?: string;
  type?: string;
  size?: number;
  public_id?: string;
  uploading?: boolean;
};

export type ChatSender = {
  _id: string;
  name?: string;
  avatar?: string | Avatar;
};

export type SharedMediaRow = {
  _id?: string;
  publicId?: string;
  name?: string;
  url?: string;
  fileType?: string;
};

export type MediaResponse = {
  data?:
    | SharedMediaRow[]
    | {
        attachments?: SharedMediaRow[];
        links?: unknown[];
      };
};

// --- Reply ---
export type MessageReplyTo = {
  messageId: string;
  content?: string;
  senderName: string;
  previewAttachment?: {
    url: string;
    name: string;
    fileType: string;
  };
};

// --- Chat box data ---
export type ChatBoxData = {
  content?: string;
  sender: ChatSender;
  attachments?: ChatAttachment[];
  createdAt?: string;
  replyTo?: MessageReplyTo;
};

// --- Messages ---
export type ChatMessage = ChatBoxData & {
  _id: string;
  isUploading?: boolean;
  readBy?: string[];
  isDeleted?: boolean;
  editedAt?: string;
  replyTo?: MessageReplyTo;
};

export type MessagesPage = {
  data?: ChatMessage[];
  groupChat?: boolean;
  totalPages?: number;
};

// --- Chat details ---
export type ChatMember = string | {
  _id?: string;
  name?: string;
  avatar?: string;
  lastSeen?: string;
  isCreator?: boolean;
  isAdmin?: boolean;
};

export type ChatDetailsData = {
  avatar?: string | string[];
  name?: string;
  groupChat?: boolean;
  members?: ChatMember[];
  myRole?: 'creator' | 'admin' | 'member' | null;
  bio?: string;
  creator?: { _id?: string; name?: string; avatar?: string };
};

export type ChatDetailsResponse = {
  data?: ChatDetailsData;
};

// --- Panel handle ---
export type ChatsViewPanelHandle = {
  clearChat: () => void;
  deleteSelected: () => void;
  forwardSelected: () => void;
  copySelected: () => void;
};

// --- Socket payloads ---
export type NewMessagePayload = {
  chatId: string;
  message: ChatMessage;
};

export type ChatReadPayload = {
  chatId: string;
  userId: string;
  lastReadAt: string;
  lastReadMessageId?: string;
};

export type MessageUpdatedPayload = {
  chatId: string;
  message: ChatMessage;
};

export type MessagesDeletedPayload = {
  chatId: string;
  messageIds: string[];
};

export type ChatClearedPayload = {
  chatId: string;
};

export type SendAttachmentsResult = {
  data?: ChatMessage;
  attachments?: ChatMessage['attachments'];
} & Partial<ChatMessage>;

export type TimelineItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage };

// --- Users / responses ---
export type SearchUserRow = User & {
  isRequested?: boolean;
};

export type SearchUsersResponse = {
  data?: SearchUserRow[];
};

// --- Last message (used in chat list entries) ---
export type ChatLastMessage = {
  content?: string;
  createdAt?: string;
  isRead?: boolean;
  sender?: { _id: string; name?: string };
};

export type ChatRow = {
  _id: string;
  name: string;
  avatar?: string | string[];
  groupChat?: boolean;
  members?: Array<string | { _id?: string }>;
  lastMessage?: ChatLastMessage | null;
  unreadCount?: number;
};

export type ChatListEntry = {
  _id: string;
  name?: string;
  avatar?: string | string[];
  groupChat?: boolean;
  members?: Array<string | { _id?: string }>;
  lastMessage?: ChatLastMessage | null;
  unreadCount?: number;
};

export type ChatsResponse = {
  data?: ChatRow[];
};

export type FriendsResponse = {
  data?: User[];
};

export type CreateGroupResult = {
  _id?: string;
};

// --- Search filters ---
export type FromFilter = 'anyone' | 'me' | 'others' | string;

export type FromOption = {
  id: FromFilter;
  label: string;
  avatar?: string | null;
  tone: 'all' | 'self' | 'peer';
};

// --- Socket user (partial/nullable auth user for socket hooks) ---
export type SocketUser = { _id?: string; name?: string; avatar?: unknown } | null;

// --- Group creator (used in profile panel) ---
export type GroupCreator = {
  _id?: string;
  name?: string;
  avatar?: string;
};

// --- Dialog / connect tabs ---
export type NewConnectTab = 'friends' | 'group';

// --- Message context menu ---
export type MessageContextMenuOption = {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
};

// --- Chat search ---
export type ChatSearchHit = {
  _id: string;
  content?: string;
  createdAt: string;
  sender: { _id: string; name: string; avatar?: string };
  attachments?: Array<{ name?: string; fileType?: string }>;
};

export type SearchMode = 'messages' | 'media' | 'links' | 'date';

// --- Group members ---
export type GroupMember = {
  _id?: string;
  name?: string;
  avatar?: string;
  isCreator?: boolean;
  isAdmin?: boolean;
};

export type UseAddMemberReturn = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  selectedMembers: string[];
  isAddMember: boolean;
  contextTargetId: string | null;
  menuState: ContextMenuState;
  members: GroupMember[];
  myRole: 'creator' | 'admin' | 'member' | null;
  canManageMembers: boolean;
  NonGroupMembersData: User[];
  isAvailableMembersLoading: boolean;
  isLoading: boolean;
  filteredMembers: GroupMember[];
  filteredNonGroupMembers: User[];
  handleSelectMember: (id: string) => void;
  addMemberHandler: () => void;
  closeContextMenu: () => void;
  handleContextMenu: (e: MouseEvent<HTMLElement>, member: GroupMember) => void;
  onSubmit: () => Promise<void>;
};
