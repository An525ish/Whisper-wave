import type { Types } from 'mongoose';

export type LastMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'media';

export type ChatLastMessage = {
  _id?: Types.ObjectId;
  content?: string;
  sender?: Types.ObjectId;
  type?: LastMessageType;
  createdAt?: Date;
};

export type ChatAvatar = {
  publicId: string;
  url: string;
};

export type IChatFields = {
  _id: Types.ObjectId;
  name: string;
  bio?: string;
  avatar?: ChatAvatar;
  groupChat: boolean;
  creator: Types.ObjectId;
  /** Group admins (subset of members; never includes creator). */
  admins: Types.ObjectId[];
  members: Types.ObjectId[];
  lastMessage?: ChatLastMessage;
  deletedFor?: Types.ObjectId[];
  clearedFor?: Array<{ user: Types.ObjectId; at: Date }>;
  createdAt: Date;
  updatedAt: Date;
};

export type PopulatedMember = {
  _id: { toString(): string };
  name: string;
  avatar?: { url?: string };
  bio?: string;
  lastSeen?: Date | string;
};

export type ChatListLastMessage = {
  _id?: string;
  content?: string;
  createdAt?: string;
  type?: LastMessageType;
  sender?: {
    _id: string;
    name?: string;
  };
  isRead: boolean;
};

export type ChatListItem = {
  _id: unknown;
  groupChat: boolean;
  name: string;
  avatar: Array<string | undefined>;
  members: Array<{ toString(): string }>;
  lastMessage: ChatListLastMessage | null;
  unreadCount: number;
};

export type UserChatWithLastMessage = {
  _id: Types.ObjectId;
  members: Types.ObjectId[];
  lastMessage?: ChatLastMessage;
};

/** Lean chat row for socket connect (room joins + DM presence). */
export type JoinedChat = {
  _id: Types.ObjectId;
  members: Types.ObjectId[];
  groupChat: boolean;
};

export type IChatReadFields = {
  _id: Types.ObjectId;
  chat: Types.ObjectId;
  user: Types.ObjectId;
  lastReadAt: Date;
  lastReadMessageId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatReadRecord = {
  _id: Types.ObjectId;
  chat: Types.ObjectId;
  user: Types.ObjectId;
  lastReadAt: Date;
  lastReadMessageId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpsertChatReadInput = {
  chat: string | Types.ObjectId;
  user: string | Types.ObjectId;
  lastReadAt: Date;
  lastReadMessageId?: string | Types.ObjectId;
};

export type ChatUnreadCount = {
  chatId: string;
  count: number;
};

export type FindChatItem = {
  _id: unknown;
  groupChat: boolean;
  name: string;
  avatar: Array<string | undefined> | null;
  notificationCount: number;
};

export type ChatNotificationInput = {
  chatId: string;
  count: number;
};

export type RealtimeNotify = {
  event: string;
  chatId?: string;
  members?: Array<string | { toString(): string }>;
  /** Socket IDs belonging to this userId will be excluded from room emit. */
  excludeUserId?: string;
  data?: unknown;
};

export type RealtimeNotificationsResult = {
  notifications: RealtimeNotify[];
};

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

export type ChatSharedLink = {
  url: string;
  host: string;
  messageId: string;
  createdAt?: Date;
};

export type ChatSharedContent = {
  attachments: Array<{
    publicId: string;
    url: string;
    name: string;
    fileType: string;
    messageId: string;
    senderId: string;
  }>;
  links: ChatSharedLink[];
};

export type CreateChatInput = {
  name: string;
  bio?: string;
  avatar?: ChatAvatar;
  groupChat?: boolean;
  creator: string | Types.ObjectId;
  members: Array<string | Types.ObjectId>;
  admins?: Array<string | Types.ObjectId>;
};

export type ChatLean = {
  _id: Types.ObjectId;
  name: string;
  bio?: string;
  avatar?: ChatAvatar;
  groupChat: boolean;
  creator: Types.ObjectId;
  admins?: Types.ObjectId[];
  members: Types.ObjectId[];
  lastMessage?: ChatLastMessage;
  clearedFor?: Array<{ user: Types.ObjectId; at: Date }>;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ChatMembersOnly = {
  _id: Types.ObjectId;
  members: Types.ObjectId[];
};

export type DirectChatMembers = {
  _id: Types.ObjectId;
  members: Types.ObjectId[];
};

export type FriendChatPopulated = {
  _id: Types.ObjectId;
  members: Array<{
    _id: { toString(): string };
    name: string;
    avatar?: { url?: string };
  }>;
};

export type ChatWithMembersPopulated = {
  _id: Types.ObjectId;
  name: string;
  bio?: string;
  avatar?: ChatAvatar;
  groupChat: boolean;
  members: PopulatedMember[];
};

export type UpdateChatPatch = Partial<{
  name: string;
  bio: string;
  avatar: ChatAvatar;
  creator: Types.ObjectId | string;
  admins: Array<Types.ObjectId | string>;
  members: Array<Types.ObjectId | string>;
  lastMessage: ChatLastMessage;
}>;

export type UpdateGroupDetailsInput = {
  name?: string;
  bio?: string;
};
