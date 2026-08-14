import dayjs from 'dayjs';
import type { ChatMessage } from '@/features/chat/types';
import type { MessageReplyTo } from '@/features/chat/types';

/** True when every member except the sender has read the message (group WhatsApp-style). */
export const isMessageFullyRead = (
  msg: Pick<ChatMessage, 'sender' | 'readBy'>,
  memberIds: string[],
): boolean => {
  const senderId = String(msg.sender._id);
  const others = memberIds.filter((id) => id !== senderId);
  if (others.length === 0) return false;

  const readers = new Set((msg.readBy ?? []).map(String));
  return others.every((id) => readers.has(id));
};

/** Direct chat: peer has read. Group: all other members have read. */
export const isOutgoingMessageRead = (
  msg: Pick<ChatMessage, 'sender' | 'readBy' | 'createdAt'>,
  opts: {
    userId: string;
    isGroupChat: boolean;
    memberIds: string[];
    peerLastReadAt?: string | null;
  },
): boolean => {
  if (String(msg.sender._id) !== opts.userId) return false;

  if (opts.isGroupChat) {
    return isMessageFullyRead(msg, opts.memberIds);
  }

  if (opts.peerLastReadAt && msg.createdAt) {
    return !dayjs(msg.createdAt).isAfter(dayjs(opts.peerLastReadAt));
  }

  return (msg.readBy ?? []).map(String).some((id) => id !== opts.userId);
};

export const buildReplySnapshot = (msg: ChatMessage): MessageReplyTo => {
  const firstAttachment = msg.attachments?.[0];
  return {
    messageId: msg._id,
    content: msg.content,
    senderName: msg.sender.name ?? 'Unknown',
    previewAttachment: firstAttachment
      ? {
          url: firstAttachment.url ?? firstAttachment.tempUrl ?? '',
          name: firstAttachment.name ?? 'Attachment',
          fileType: firstAttachment.type ?? '',
        }
      : undefined,
  };
};

export const getReplyPreviewText = (reply: MessageReplyTo): string =>
  reply.previewAttachment?.name || reply.content?.trim() || 'Message';
