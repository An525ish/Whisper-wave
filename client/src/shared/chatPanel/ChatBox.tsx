import { fileFormat, getMediaKindFromFile, type FileFormatKind } from '@/lib/features';
import { extractLinksFromText, isLinkOnlyMessage } from '@/lib/links';
import dayjs from 'dayjs';
import RenderAttachments from './RenderAttachments';
import LinkPreview from './LinkPreview';
import MessageContent from './MessageContent';
import { useAuthStore } from '@/stores/auth';
import Image from '@/components/ui/Image';
import ReadReceipt from '@/components/icons/ReadReceipt';
import ImageViewer, {
  type MediaFile,
} from '@/components/image-viewer/Image-Viewer';
import { useGetMediaQuery } from '@/features/api/hooks';
import toast from 'react-hot-toast';
import type { Avatar } from '@/types';
import { useMemo, useState, type MouseEvent } from 'react';
import { useParams } from 'react-router-dom';

type ChatAttachment = {
  url?: string;
  tempUrl?: string;
  name?: string;
  type?: string;
  size?: number;
  public_id?: string;
  uploading?: boolean;
};

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

type ChatSender = {
  _id: string;
  name?: string;
  avatar?: string | Avatar;
};

export type ChatBoxData = {
  content?: string;
  sender: ChatSender;
  attachments?: ChatAttachment[];
  createdAt?: string;
  replyTo?: MessageReplyTo;
};

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

type SharedMediaRow = {
  _id?: string;
  publicId?: string;
  name?: string;
  url?: string;
  fileType?: string;
};

type MediaResponse = {
  data?:
    | SharedMediaRow[]
    | {
        attachments?: SharedMediaRow[];
        links?: unknown[];
      };
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

const ChatBox = ({
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
  const [galleryOverride, setGalleryOverride] = useState<MediaFile[] | null>(
    null,
  );

  const user = useAuthStore((s) => s.user);
  const sameSender = String(sender._id) === String(user?._id ?? '');
  const currentTime = dayjs(createdAt).format('hh:mm A');
  const displayName = sameSender
    ? user?.name || sender.name || 'You'
    : sender.name || 'Unknown';

  const { data: media } = useGetMediaQuery({ chatId }, { skip: !chatId });

  /** Same shared media list as the profile gallery. */
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

  const renderReceipt = (hidden = false) => {
    if (!showReadReceipt) return null;

    return (
      <span
        className={`ml-1 inline-flex shrink-0 items-center ${hidden ? 'opacity-0' : ''}`}
        aria-label={isRead ? 'Read' : 'Sent'}
      >
        <ReadReceipt read={isRead} />
      </span>
    );
  };

  const renderTimestamp = (className: string) => (
    <time
      dateTime={createdAt}
      className={`inline-flex flex-nowrap items-center whitespace-nowrap ${className}`}
    >
      <span>{currentTime}</span>
      {renderReceipt()}
    </time>
  );

  const timeReserve = (
    <span
      aria-hidden
      className="pointer-events-none ml-4 inline-flex flex-nowrap items-center select-none whitespace-nowrap align-bottom text-[11px] leading-[15px] opacity-0"
    >
      {currentTime}
      {renderReceipt(true)}
    </span>
  );

  const attachmentTimeClass =
    'rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide tabular-nums text-white-pure shadow-sm backdrop-blur-[1px]';

  const mediaTimestamp = renderTimestamp(
    `pointer-events-none absolute bottom-1 right-2 z-[2] ${attachmentTimeClass}`,
  );

  const fileTimestamp = renderTimestamp(
    `pointer-events-none ${attachmentTimeClass}`,
  );

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

    // Fresh upload not in shared media yet — prepend clicked file, keep rest.
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

  const handleFileAction = async (
    e: MouseEvent,
    attachment: ChatAttachment,
  ) => {
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
  const showBubbleTimestamp = !mediaOnly;

  const replyPreviewText = replyTo
    ? replyTo.previewAttachment?.name ||
      replyTo.content?.trim() ||
      'Message'
    : '';

  if (!hasAttachments && !hasText && !isDeleted) return null;

  if (isDeleted) {
    return (
      <div
        className={`flex w-fit max-w-[min(100%,20rem)] items-end ${
          sameSender ? 'self-end' : 'self-start'
        }`}
      >
        <div
          className={`rounded-2xl border border-dashed px-3.5 py-2 text-sm italic ${
            sameSender
              ? 'border-green/25 bg-green-dark/30 text-body-300'
              : 'border-border/60 bg-primary/50 text-body-300'
          }`}
        >
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex w-fit max-w-[min(100%,20rem)] gap-2 items-end shadow-[0_4px_18px_rgba(0,0,0,0.28)] ${
          mediaOnly || linkOnly
            ? 'p-1.5'
            : hasAttachments
              ? 'p-1.5 pb-2'
              : 'px-3.5 pb-2.5 pt-2'
        } ${
          sameSender
            ? 'bubble-out self-end border border-green/35 bg-green-dark/55'
            : 'bubble-in self-start border border-border bg-primary/90'
        } ${searchHighlight ? 'search-focus-blink' : ''}`}
      >
        {isGroupChat ? (
          <div className="h-9 w-9 shrink-0 self-end overflow-hidden rounded-full border border-border/60 ring-1 ring-white/5">
            <Image
              src={avatarSrc}
              alt={sender.name ?? ''}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="relative min-w-0 max-w-full">
          {isGroupChat ? (
            <p
              className={`px-1.5 pt-1 text-xs font-medium capitalize tracking-wide ${
                hasAttachments ? 'mb-2' : 'mb-0.5'
              } ${sameSender ? 'text-green/80' : 'text-green'}`}
            >
              {displayName}
            </p>
          ) : null}

          {replyTo ? (
            <div
              className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 ${
                sameSender
                  ? 'border-green/70 bg-black/25'
                  : 'border-green bg-black/20'
              }`}
            >
              <p className="text-[11px] font-semibold text-green">
                {replyTo.senderName}
              </p>
              <p className="truncate text-xs text-body-300">{replyPreviewText}</p>
            </div>
          ) : null}

          {hasAttachments ? (
            <div
              className={`${
                multiMedia
                  ? 'grid w-[14.5rem] max-w-full grid-cols-2 gap-1'
                  : 'flex w-fit flex-col gap-1'
              } ${hasText ? 'mb-1.5' : ''}`}
            >
              {attachments.map((attachment, index) => {
                const url = attachment.url || attachment.tempUrl;
                const fileType = resolveAttachmentKind(attachment, url ?? '');
                const isLast = index === attachments.length - 1;
                const isVisualMedia =
                  fileType === 'image' ||
                  fileType === 'video' ||
                  fileType === 'audio';
                const stampOnMedia = mediaOnly && isLast && isVisualMedia;
                const stampOnFile = mediaOnly && isLast && !isVisualMedia;

                return (
                  <div
                    key={attachment.public_id || index}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleFileAction(e, attachment)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void handleFileAction(
                          e as unknown as MouseEvent,
                          attachment,
                        );
                      }
                    }}
                    className={`block cursor-pointer overflow-hidden rounded-[1rem] text-left transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-green/45 ${
                      multiMedia ? 'min-w-0' : 'w-fit max-w-full'
                    }`}
                  >
                    <RenderAttachments
                      fileType={fileType}
                      url={url ?? ''}
                      name={attachment.name}
                      type={attachment.type}
                      size={attachment.size}
                      isUploading={attachment.uploading}
                      overlay={
                        stampOnMedia
                          ? mediaTimestamp
                          : stampOnFile
                            ? fileTimestamp
                            : null
                      }
                      fill={multiMedia}
                      onDownload={
                        !isVisualMedia
                          ? () => {
                              void downloadAttachment(attachment);
                            }
                          : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : null}

          {linkOnly ? (
            <div className="relative min-w-0 w-full px-0.5">
              {links.map((link, index) => (
                <LinkPreview
                  key={link.url}
                  link={link}
                  variant={linkVariant}
                  lead={index === 0}
                />
              ))}
              <div className="mt-1 text-right leading-none">{timeReserve}</div>
            </div>
          ) : hasText ? (
            <div className={`relative ${hasAttachments ? 'px-2 pt-0.5' : ''}`}>
              <p className="m-0 text-sm leading-snug break-words whitespace-pre-wrap text-body">
                <MessageContent
                  content={content!}
                  highlightQuery={highlightQuery}
                />
                {links.length === 0 ? timeReserve : null}
              </p>
              {links.length > 0 ? (
                <>
                  {links.map((link, index) => (
                    <LinkPreview
                      key={link.url}
                      link={link}
                      variant={linkVariant}
                      lead={index === 0 && !content}
                    />
                  ))}
                  <div className="mt-1 text-right leading-none">{timeReserve}</div>
                </>
              ) : null}
            </div>
          ) : null}

          {showBubbleTimestamp
            ? renderTimestamp(
                `absolute bottom-0 right-1.5 translate-y-[2px] text-[11px] leading-[15px] whitespace-nowrap pointer-events-none select-none ${
                  sameSender ? 'text-body-700' : 'text-body-300'
                }`,
              )
            : null}
          {editedAt ? (
            <span
              className={`absolute bottom-0 ${
                showBubbleTimestamp ? 'right-[4.5rem]' : 'right-1.5'
              } translate-y-[2px] text-[10px] italic text-body-300`}
            >
              edited
            </span>
          ) : null}
        </div>
      </div>

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

export default ChatBox;
