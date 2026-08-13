import { type MouseEvent } from 'react';
import { fileFormat, type FileFormatKind } from '@/shared/utils/fileFormat';
import type { ParsedLink } from '@/shared/utils/linkParser';
import Image from '@/shared/components/ui/Image';
import ReadReceipt from '@/shared/components/icons/ReadReceipt';
import RenderAttachments from './RenderAttachments';
import LinkPreview from './LinkPreview';
import MessageContent from './MessageContent';
import type { MessageReplyTo } from './ChatBox';

type ChatAttachment = {
  url?: string;
  tempUrl?: string;
  name?: string;
  type?: string;
  size?: number;
  public_id?: string;
  uploading?: boolean;
};

export type MessageBubbleProps = {
  sameSender: boolean;
  isGroupChat?: boolean;
  avatarSrc?: string;
  displayName: string;
  isDeleted?: boolean;
  searchHighlight?: boolean;
  content?: string;
  attachments: ChatAttachment[];
  links: ParsedLink[];
  linkVariant: 'outgoing' | 'incoming';
  highlightQuery?: string;
  hasText: boolean;
  hasAttachments: boolean;
  mediaOnly: boolean;
  linkOnly: boolean;
  multiMedia: boolean;
  replyTo?: MessageReplyTo;
  replyPreviewText: string;
  currentTime: string;
  createdAt?: string;
  showReadReceipt?: boolean;
  isRead?: boolean;
  editedAt?: string;
  onFileAction: (e: MouseEvent, attachment: ChatAttachment) => Promise<void> | void;
  onDownload: (attachment: ChatAttachment) => Promise<void> | void;
};

const resolveKind = (attachment: ChatAttachment, url: string): FileFormatKind => {
  if (attachment.type?.startsWith('image/')) return 'image';
  if (attachment.type?.startsWith('video/')) return 'video';
  if (attachment.type?.startsWith('audio/')) return 'audio';
  const fromName = fileFormat(attachment.name);
  if (fromName !== 'unknown') return fromName;
  return fileFormat(url);
};

const attachmentTimeClass =
  'rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide tabular-nums text-white-pure shadow-sm backdrop-blur-[1px]';

const MessageBubble = ({
  sameSender,
  isGroupChat,
  avatarSrc,
  displayName,
  isDeleted,
  searchHighlight,
  content,
  attachments,
  links,
  linkVariant,
  highlightQuery,
  hasText,
  hasAttachments,
  mediaOnly,
  linkOnly,
  multiMedia,
  replyTo,
  replyPreviewText,
  currentTime,
  createdAt,
  showReadReceipt,
  isRead,
  editedAt,
  onFileAction,
  onDownload,
}: MessageBubbleProps) => {
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

  const showBubbleTimestamp = !mediaOnly;
  const mediaTimestamp = renderTimestamp(
    `pointer-events-none absolute bottom-1 right-2 z-2 ${attachmentTimeClass}`,
  );
  const fileTimestamp = renderTimestamp(`pointer-events-none ${attachmentTimeClass}`);

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
          <Image src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
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
            className={`mb-1.5 overflow-hidden rounded-lg border-l-2 ${
              sameSender ? 'border-green/70 bg-black/30' : 'border-green bg-black/25'
            }`}
          >
            <div className="flex items-stretch gap-2 px-2 py-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold tracking-wide text-green">
                  {replyTo.senderName}
                </p>
                <p className="mt-0.5 truncate text-xs leading-snug text-body-300">
                  {replyPreviewText}
                </p>
              </div>
              {replyTo.previewAttachment?.url &&
              (replyTo.previewAttachment.fileType?.startsWith('image/') ||
                /\.(avif|gif|jpe?g|png|webp)(\?|$)/i.test(replyTo.previewAttachment.url)) ? (
                <img
                  src={replyTo.previewAttachment.url}
                  alt=""
                  className="h-10 w-10 shrink-0 self-center rounded-md object-cover ring-1 ring-white/10"
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {hasAttachments ? (
          <div
            className={`${
              multiMedia
                ? 'grid w-58 max-w-full grid-cols-2 gap-1'
                : 'flex w-fit flex-col gap-1'
            } ${hasText ? 'mb-1.5' : ''}`}
          >
            {attachments.map((attachment, index) => {
              const url = attachment.url || attachment.tempUrl;
              const fileType = resolveKind(attachment, url ?? '');
              const isLast = index === attachments.length - 1;
              const isVisualMedia =
                fileType === 'image' || fileType === 'video' || fileType === 'audio';
              const stampOnMedia = mediaOnly && isLast && isVisualMedia;
              const stampOnFile = mediaOnly && isLast && !isVisualMedia;

              return (
                <div
                  key={attachment.public_id || index}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => void onFileAction(e, attachment)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void onFileAction(e as unknown as MouseEvent, attachment);
                    }
                  }}
                  className={`block cursor-pointer overflow-hidden rounded-2xl text-left transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-green/45 ${
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
                    overlay={stampOnMedia ? mediaTimestamp : stampOnFile ? fileTimestamp : null}
                    fill={multiMedia}
                    onDownload={!isVisualMedia ? () => { void onDownload(attachment); } : undefined}
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        {linkOnly ? (
          <div className="relative min-w-0 w-full px-0.5">
            {links.map((link, index) => (
              <LinkPreview key={link.url} link={link} variant={linkVariant} lead={index === 0} />
            ))}
            <div className="mt-1 text-right leading-none">{timeReserve}</div>
          </div>
        ) : hasText ? (
          <div className={`relative ${hasAttachments ? 'px-2 pt-0.5' : ''}`}>
            <p className="m-0 text-sm leading-snug wrap-break-word whitespace-pre-wrap text-body">
              <MessageContent content={content!} highlightQuery={highlightQuery} />
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
              `absolute bottom-0 right-1.5 translate-y-0.5 text-[11px] leading-[15px] whitespace-nowrap pointer-events-none select-none ${
                sameSender ? 'text-body-700' : 'text-body-300'
              }`,
            )
          : null}
        {editedAt ? (
          <span
            className={`absolute bottom-0 ${
              showBubbleTimestamp ? 'right-[4.5rem]' : 'right-1.5'
            } translate-y-0.5 text-[10px] italic text-body-300`}
          >
            edited
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default MessageBubble;
