import type {
  ChatLean,
  ChatListItem,
  ChatNotificationInput,
  RealtimeNotify,
  UpdateGroupDetailsInput,
} from './chat.js';

export type ChatMutationMessageResult = {
  message: string;
  memberIds?: string[];
  notifications: RealtimeNotify[];
};

export type CreateGroupChatInput = {
  name: string;
  members: string[];
  bio?: string;
};

export type ChatMutationResult = {
  chat: ChatLean;
  notifications: RealtimeNotify[];
};

export type PaginatedChatsResult = {
  data: ChatListItem[];
  totalPages: number;
};

export type CreateGroupChatServiceInput = {
  userId: string;
  input: CreateGroupChatInput;
  avatarFile?: import('./message.js').UploadableFile;
};

export type UpdateGroupDetailsServiceInput = {
  userId: string;
  chatId: string;
  input: UpdateGroupDetailsInput;
  avatarFile?: import('./message.js').UploadableFile;
};

export type AddGroupMembersInput = {
  userId: string;
  chatId: string;
  members: string[];
};

export type RemoveGroupMemberInput = {
  userId: string;
  chatId: string;
  memberToBeRemoved: string;
};

export type SetGroupMemberAdminInput = {
  userId: string;
  chatId: string;
  memberId: string;
  makeAdmin: boolean;
};

export type LeaveGroupInput = {
  userId: string;
  chatId: string;
  newCreatorId?: string;
};

export type DeleteGroupInput = {
  userId: string;
  chatId: string;
};

export type GetMyChatsInput = {
  userId: string;
  page: number;
};

export type FindChatsInput = {
  userId: string;
  userIds: string[];
  notifications: ChatNotificationInput[];
};

export type GetChatDetailsInput = {
  userId: string;
  chatId: string;
  populate: boolean;
};

export type MarkChatReadInput = {
  userId: string;
  chatId: string;
  lastReadMessageId?: string;
};

export type MarkAllChatsReadInput = {
  userId: string;
};

export type GetChatMediaInput = {
  userId: string;
  chatId: string;
};

export type MarkChatReadResult = {
  chatId: string;
  lastReadAt: Date;
  lastReadMessageId?: string;
  notifications: RealtimeNotify[];
};

export type MarkAllChatsReadResult = {
  marked: number;
  lastReadAt: Date;
  notifications: RealtimeNotify[];
};
