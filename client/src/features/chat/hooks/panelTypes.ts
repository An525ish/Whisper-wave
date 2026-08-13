import type { ChatBoxData, MessageReplyTo } from '@/features/chat/components/message/ChatBox';

export type { MessageReplyTo };

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

export type ChatMember = string | { _id?: string };

export type ChatDetailsResponse = {
  data?: {
    members?: ChatMember[];
    groupChat?: boolean;
    myRole?: 'creator' | 'admin' | 'member' | null;
  };
};

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
