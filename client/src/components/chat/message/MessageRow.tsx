import { fileFormat, getMediaKindFromFile, type FileFormatKind } from '@/utils/fileFormat';
import { extractLinksFromText, isLinkOnlyMessage } from '@/utils/linkParser';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/auth';
import ImageViewer, {
  type MediaFile,
} from '@/components/ui/image-viewer/ImageViewer';
import { useGetMediaQuery } from '@/hooks/chat';
import toast from 'react-hot-toast';
import { useMemo, useState, type MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import MessageBubble from '@/components/chat/message/MessageBubble';
import type {
  ChatAttachment, MessageReplyTo, ChatBoxData,
  SharedMediaRow, MediaResponse,
} from '@/types/chat';

export type { MessageReplyTo, ChatBoxData };

type ChatBoxProps = {
  chatData: ChatBoxData;
  isGroupChat?: boolean;
  showReadReceipt?: boolean;
  isRead?: boolean;
  highlightQuery?: string;
  searchHighlight?: boolean;
  isDeleted?: boolean;
  editedAt?: string;
};

const resolveAttachmentKind = (
  attachment: ChatAttachment,
  url: string,
): FileFormatKind => {
  if (attachment.type?.startsWith('image/')) return 'image';
  if (attachment.type?.startsWith('video/')) return 'video';
  if (attachment.type?.startsWith('audio/')) return 'audio';
  const fromName = fileFormat(attachment.name);
  if (fromName !== 'unknown') return fromName;
  return fileFormat(url);
};

const normalizeMediaAttachments = (
  data: MediaResponse['data'],
): SharedMediaRow[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.attachments ?? [];
};

const MessageRow = ({
  chatData,
  isGroupChat,
  showReadReceipt = false,
  isRead = false,
  highlightQuery,
  searchHighlight = false,
  isDeleted = false,
  editedAt,
}: ChatBoxProps) => {
  const { chatId } = useParams();
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

  const { data: media } = useGetMediaQuery({ chatId }, { skip: !chatId });

  const sharedGalleryFiles = useMemo(() => {
    const mediaData = normalizeMediaAttachments(
      (media as MediaResponse | undefined)?.data,
    );
    return mediaData
      .filter((file) => file.fileType !== 'document' && Boolean(file.url))
      .filter((file) => {
        const kind = getMediaKindFromFile(file);
        return kind === 'image' || kind === 'video';
      })
      .map((file) => ({
        _id: file._id ?? file.publicId ?? file.url!,
        url: file.url!,
        name: file.name,
        publicId: file.publicId,
        fileType: file.fileType,
      }));
  }, [media]);

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
      setGalleryOverride(null);
      setGalleryIndex(matchIndex);
      return;
    }

    const fallback: MediaFile = {
      _id: attachment.public_id || url,
      url,
      name: attachment.name,
      publicId: attachment.public_id,
      fileType: attachment.type,
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
    const fileType = resolveAttachmentKind(attachment, url);
    if (fileType === 'image' || fileType === 'video') {
      openSharedGallery(attachment, url);
      return;
    }
    if (fileType === 'pdf') {
      window.open(url, '_blank');
      return;
    }
    await downloadAttachment(attachment);
  };

  const avatarSrc =
    typeof sender.avatar === 'string' ? sender.avatar : sender.avatar?.url;
  const linkVariant = sameSender ? 'outgoing' : 'incoming';
  const multiMedia = attachments.length > 1;
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
        multiMedia={multiMedia}
        replyTo={replyTo}
        replyPreviewText={replyPreviewText}
        currentTime={currentTime}
        createdAt={createdAt}
        showReadReceipt={showReadReceipt}
        isRead={isRead}
        editedAt={editedAt}
        onFileAction={handleFileAction}
        onDownload={downloadAttachment}
      />

      {galleryIndex !== null && activeGalleryFiles.length > 0 ? (
        <ImageViewer
          mediaFiles={activeGalleryFiles}
          initialIndex={galleryIndex}
          onClose={closeGallery}
        />
      ) : null}
    </>
  );
};

export default MessageRow;
