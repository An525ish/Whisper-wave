// Types local to chat UI components and hooks (kept out of .tsx / hook files).
import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import type { ContextMenuState, User } from '@/shared/types';
import type { ChatSearchHit, MessagesPage } from './chat';
import type { UploadFileProgress } from './upload';

export type ImageQuality = 'standard' | 'hd';

export type LinkPreviewSurface = 'composer' | 'incoming' | 'outgoing';

export type ComposerPickerTab = 'emoji' | 'gif' | 'meme';

export type SearchAttachmentKind = 'image' | 'video' | 'audio' | 'other';

export type OtherMember = { _id: string; name: string; avatar?: string; isAdmin?: boolean };

export type CreatorLeaveMember = {
  _id: string;
  name: string;
  avatar?: string | null;
  isAdmin?: boolean;
};

export type CreatorLeaveRow = {
  id: string;
  label: string;
  avatar?: string | null;
  isRandom?: boolean;
  isAdmin?: boolean;
};

export type ReceiptUser = { _id: string; name: string; avatar?: { url?: string } };

export type StickyDayHeader = {
  label: string;
  dayIndex: number;
  pushY: number;
};

export type GifSelection = {
  url: string;
  id: string;
  title: string;
  mimeType?: string;
  kind?: 'gif' | 'meme';
};

export type UploadInput = {
  chatId: string;
  files: File[];
  content?: string;
  replyToMessageId?: string;
  imageQuality?: ImageQuality;
};

export type UseAttachmentUploadReturn = {
  /** Kick off the 3-step sign → upload → commit flow. Returns the server response or null on failure. */
  upload: (input: UploadInput) => Promise<unknown>;
  reset: () => void;
  isUploading: boolean;
  /** Per-file progress state. Useful for rendering progress bars. */
  fileProgress: UploadFileProgress[];
};

export type MessageContextResponse = {
  page: number;
  totalPages: number;
  data: MessagesPage['data'];
};

export type GroupMember = {
  _id: string;
  name: string;
  avatar?: string;
  isCreator?: boolean;
  isAdmin?: boolean;
};

export type FriendsResponse = { data?: User[] };

export type GroupMembersResponse = {
  data?: {
    members?: GroupMember[];
    myRole?: 'creator' | 'admin' | 'member' | null;
  };
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

/** Narrowed member shape used for the chat-search from-filter selector. */
export type ChatMemberObject = { _id?: string; name?: string; avatar?: string };

export type JumpDateResponse = {
  data?: { _id: string; createdAt: string; exactDay: boolean } | null;
};

export type SearchResponse = { data?: ChatSearchHit[]; total?: number };
