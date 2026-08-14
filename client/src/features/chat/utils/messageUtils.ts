import type { ChatMessage } from '@/features/chat/types';
import type { MessageReplyTo } from '@/features/chat/types';

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
