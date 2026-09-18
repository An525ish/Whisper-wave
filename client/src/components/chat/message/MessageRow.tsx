import { resolveAttachmentKind } from '@/utils/fileFormat';
import { extractLinksFromText, isLinkOnlyMessage } from '@/utils/linkParser';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/auth';
import ImageViewer, {
  type MediaFile,
} from '@/components/ui/image-viewer/ImageViewer';
import toast from 'react-hot-toast';
import { useState, type MouseEvent } from 'react';
import MessageBubble from '@/components/chat/message/MessageBubble';
import type {
  ChatAttachment, MessageReplyTo, ChatBoxData, MessageReaction,
} from '@/types/chat';

export type { MessageReplyTo, ChatBoxData };

type ChatBoxProps = {
  chatData: ChatBoxData & { _id?: string; reactions?: MessageReaction[] };
  chatId?: string;
  sharedGalleryFiles?: MediaFile[];
  isGroupChat?: boolean;
  showReadReceipt?: boolean;
  isRead?: boolean;
  highlightQuery?: string;
  searchHighlight?: boolean;
  isDeleted?: boolean;
  editedAt?: string;
  centered?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onForwardMessage?: (messageId: string) => void;
};


const MessageRow = ({
  chatData,
  chatId,
  sharedGalleryFiles: sharedGalleryFilesProp,
  isGroupChat,
  showReadReceipt = false,
  isRead = false,
  highlightQuery,
  searchHighlight = false,
  isDeleted = false,
  editedAt,
  centered = false,
  onDeleteMessage,
  onForwardMessage,
}: ChatBoxProps) => {
  const { content, sender, attachments = [], createdAt, replyTo } = chatData;
  const links = content ? extractLinksFromText(content) : [];
  const linkOnly = content ? isLinkOnlyMessage(content) : false;
  const hasAttachments = attachments.length > 0;
  const hasText = Boolean(content?.trim());
  const mediaOnly = hasAttachments && !hasText;

  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [galleryOverride, setGalleryOverride] = useState<MediaFile[] | null>(null);

  const user = useAuthStore((s) => s.user);
  const sameSender = String(sender._id) === String(user?._id ?? '');
  const currentTime = dayjs(createdAt).format('hh:mm A');
  const displayName = sameSender
    ? user?.name || sender.name || 'You'
    : sender.name || 'Unknown';

  const sharedGalleryFiles = sharedGalleryFilesProp ?? [];

  const activeGalleryFiles = galleryOverride ?? sharedGalleryFiles;

  const openSharedGallery = (attachment: ChatAttachment, url: string) => {
    const matchIndex = sharedGalleryFiles.findIndex(
      (file) =>
        file.url === url ||
        (attachment.public_id &&
          (file.publicId === attachment.public_id ||
            file._id === attachment.public_id)),
    );

    if (matchIndex >= 0) {
      // Stamp messageId so delete/forward work for this item
      const stamped = sharedGalleryFiles.map((f, i) =>
        i === matchIndex ? { ...f, messageId: chatData._id ?? undefined, senderId: String(sender._id) } : f,
      );
      setGalleryOverride(stamped);
      setGalleryIndex(matchIndex);
      return;
    }

    const fallback: MediaFile = {
      _id: attachment.public_id || url,
      url,
      name: attachment.name,
      publicId: attachment.public_id,
      fileType: attachment.type,
      messageId: chatData._id,
      senderId: String(sender._id),
    };
    setGalleryOverride([fallback, ...sharedGalleryFiles]);
    setGalleryIndex(0);
  };

  const closeGallery = () => {
    setGalleryIndex(null);
    setGalleryOverride(null);
  };

  const downloadAttachment = async (attachment: ChatAttachment) => {
    const url = attachment.url || attachment.tempUrl;
    if (!url || attachment.uploading) return;
    try {
      const file = await fetch(url);
      const blob = await file.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.name ?? 'download';
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error('Download Failed');
    }
  };

  const handleFileAction = async (e: MouseEvent, attachment: ChatAttachment) => {
    e.preventDefault();
    const url = attachment.url || attachment.tempUrl;
    if (!url) return;
    const fileType = resolveAttachmentKind({ ...attachment, url });
    if (fileType === 'image' || fileType === 'video' || fileType === 'gif') {
      openSharedGallery(attachment, url);
      return;
    }
    // resolveAttachmentKind maps PDFs to 'doc'; check MIME/name directly
    if (/pdf/i.test(attachment.type ?? '') || /\.pdf$/i.test(attachment.name ?? '')) {
      window.open(url, '_blank');
      return;
    }
    await downloadAttachment(attachment);
  };

  const avatarSrc =
    typeof sender.avatar === 'string' ? sender.avatar : sender.avatar?.url;
  const linkVariant = sameSender ? 'outgoing' : 'incoming';
  const replyPreviewText = replyTo
    ? replyTo.previewAttachment?.name || replyTo.content?.trim() || 'Message'
    : '';

  if (!hasAttachments && !hasText && !isDeleted) return null;

  return (
    <>
      <MessageBubble
        sameSender={sameSender}
        isGroupChat={isGroupChat}
        avatarSrc={avatarSrc}
        displayName={displayName}
        isDeleted={isDeleted}
        searchHighlight={searchHighlight}
        content={content}
        attachments={attachments}
        links={links}
        linkVariant={linkVariant}
        highlightQuery={highlightQuery}
        hasText={hasText}
        hasAttachments={hasAttachments}
        mediaOnly={mediaOnly}
        linkOnly={linkOnly}
        replyTo={replyTo}
        replyPreviewText={replyPreviewText}
        currentTime={currentTime}
        createdAt={createdAt}
        showReadReceipt={showReadReceipt}
        isRead={isRead}
        editedAt={editedAt}
        centered={centered}
        onFileAction={handleFileAction}
        onDownload={downloadAttachment}
      />

      {galleryIndex !== null && activeGalleryFiles.length > 0 ? (
        <ImageViewer
          mediaFiles={activeGalleryFiles}
          initialIndex={galleryIndex}
          onClose={closeGallery}
          onDelete={onDeleteMessage && chatData._id ? (_file) => { closeGallery(); onDeleteMessage(chatData._id!); } : undefined}
          onForward={onForwardMessage && chatData._id ? (_file) => { closeGallery(); onForwardMessage(chatData._id!); } : undefined}
          chatId={chatId ?? undefined}
        />
      ) : null}
    </>
  );
};

export default MessageRow;
