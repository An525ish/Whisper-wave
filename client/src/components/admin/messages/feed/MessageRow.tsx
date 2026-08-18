import { useMemo, useState } from 'react';
import Image from '@/components/ui/Image';
import ImageViewer from '@/components/ui/image-viewer/ImageViewer';
import ChatIcon from '@/components/ui/icons/Chat';
import TrashIcon from '@/components/ui/icons/Trash';
import RetryIcon from '@/components/ui/icons/Retry';
import type { AdminMessageRow } from '@/types/admin';
import {
  formatMessageSent,
  isImageAttachment,
  isVideoAttachment,
  messageRelativeTime,
} from '@/utils/admin/messages';
import MessageBody from './MessageBody';
import MessageStatusDot from './MessageStatusDot';

type MessageRowProps = {
  msg: AdminMessageRow;
  onDelete: () => void;
  onRetry: () => void;
  deleting: boolean;
  retrying: boolean;
};

const MessageRow = ({ msg, onDelete, onRetry, deleting, retrying }: MessageRowProps) => {
  const isFailed = msg.status === 'failed';
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const mediaFiles = useMemo(
    () =>
      (msg.attachments ?? [])
        .filter(
          (attachment) =>
            (isImageAttachment(attachment) || isVideoAttachment(attachment))
            && Boolean(attachment.url),
        )
        .map((attachment, index) => ({
          _id: `${msg._id}-att-${index}`,
          url: attachment.url!,
          name: attachment.name,
          fileType: attachment.fileType,
        })),
    [msg.attachments, msg._id],
  );

  const handleImageOpen = (chipIndex: number) => {
    const attachment = (msg.attachments ?? [])[chipIndex];
    if (!attachment?.url) return;
    const viewerIdx = mediaFiles.findIndex((file) => file.url === attachment.url);
    if (viewerIdx >= 0) setViewerIndex(viewerIdx);
  };

  return (
    <>
      <article
        className={`group relative rounded-xl px-3 py-4 transition-colors hover:bg-primary/22 sm:px-4 ${
          isFailed ? 'bg-red/3' : ''
        }`}
      >
        <div
          className={`absolute bottom-3 left-0 top-3 w-0.5 rounded-full ${
            isFailed ? 'bg-red/45' : 'bg-green/35'
          }`}
          aria-hidden
        />

        <div className="flex items-start gap-3 pl-2">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-border/35 transition group-hover:ring-blue/25">
            <Image
              src={msg.sender?.avatar?.url}
              alt={msg.sender?.name ?? 'Sender'}
              className="h-full w-full object-cover"
              displayWidth={88}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-body">
                    {msg.sender?.name ?? 'Unknown'}
                  </span>
                  <span className="text-xs text-body-300/50">@{msg.sender?.username ?? '—'}</span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {msg.chat?.name ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue">
                      <ChatIcon className="h-3 w-3 shrink-0 opacity-80" />
                      {msg.chat.name}
                    </span>
                  ) : (
                    <span className="text-[11px] text-body-300/45">Direct message</span>
                  )}
                  <span className="text-body-300/20" aria-hidden>
                    ·
                  </span>
                  <MessageStatusDot status={msg.status} />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <time
                  className="mr-0.5 text-[11px] tabular-nums text-body-300/45"
                  title={formatMessageSent(msg.createdAt)}
                >
                  {messageRelativeTime(msg.createdAt)}
                </time>
                {isFailed && (
                  <button
                    type="button"
                    onClick={onRetry}
                    disabled={retrying}
                    className="rounded-lg p-2 text-body-300/50 transition hover:bg-green/10 hover:text-green disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Retry delivery"
                    aria-label="Retry message delivery"
                  >
                    <RetryIcon className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="rounded-lg p-2 text-body-300/35 transition hover:bg-red/10 hover:text-red disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete message"
                  aria-label="Delete message"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3">
              <MessageBody msg={msg} onImageOpen={handleImageOpen} />
            </div>
          </div>
        </div>
      </article>

      {viewerIndex !== null && mediaFiles.length > 0 && (
        <ImageViewer
          mediaFiles={mediaFiles}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
};

export default MessageRow;
