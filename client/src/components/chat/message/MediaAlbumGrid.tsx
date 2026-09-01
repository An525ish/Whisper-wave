import { type MouseEvent, type ReactNode } from 'react';
import RenderAttachments from '@/components/chat/message/RenderAttachments';
import type { ChatAttachment } from '@/types/chat';
import type { FileFormatKind } from '@/utils/fileFormat';

type MediaAlbumGridProps = {
  attachments: ChatAttachment[];
  resolveKind: (attachment: ChatAttachment, url: string) => FileFormatKind;
  onFileAction: (e: MouseEvent, attachment: ChatAttachment) => void | Promise<void>;
  onDownload: (attachment: ChatAttachment) => void | Promise<void>;
  /** Timestamp + read receipt for media-only albums (WhatsApp-style overlay). */
  albumOverlay?: ReactNode;
  isUploading?: (attachment: ChatAttachment) => boolean;
};

const ALBUM_WIDTH = 'w-[min(100%,18.75rem)]';

/** WhatsApp-style tile placement for 2–4 visible cells. */
const tileLayout = (count: number, index: number): string => {
  if (count === 2) return 'col-span-1 row-span-1';
  if (count === 3) return index === 0 ? 'col-span-1 row-span-2' : 'col-span-1 row-span-1';
  return 'col-span-1 row-span-1';
};

const gridClass = (visible: number): string => {
  if (visible === 2) {
    return `grid ${ALBUM_WIDTH} grid-cols-2 grid-rows-1 gap-0.5 h-40`;
  }
  return `grid ${ALBUM_WIDTH} grid-cols-2 grid-rows-2 gap-0.5 h-52`;
};

const MediaAlbumGrid = ({
  attachments,
  resolveKind,
  onFileAction,
  onDownload,
  albumOverlay,
  isUploading,
}: MediaAlbumGridProps) => {
  const total = attachments.length;
  const visibleCount = total > 4 ? 4 : total;
  const overflow = total > 4 ? total - 4 : 0;
  const items = attachments.slice(0, visibleCount);

  return (
    <div className={`relative overflow-hidden rounded-xl ${ALBUM_WIDTH}`}>
      <div className={gridClass(visibleCount)}>
        {items.map((attachment, index) => {
          const url = attachment.url || attachment.tempUrl || '';
          const fileType = resolveKind(attachment, url);
          const isVisual = fileType === 'image' || fileType === 'video';
          const showOverflow = overflow > 0 && index === 3;

          return (
            <div
              key={attachment.public_id || `${url}-${index}`}
              role="button"
              tabIndex={0}
              onClick={(e) => void onFileAction(e, attachment)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void onFileAction(e as unknown as MouseEvent, attachment);
                }
              }}
              className={`relative min-h-0 min-w-0 cursor-pointer overflow-hidden bg-[#0c1014] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-green/45 ${tileLayout(visibleCount, index)}`}
            >
              <RenderAttachments
                fileType={fileType}
                url={url}
                name={attachment.name}
                type={attachment.type}
                size={attachment.size}
                isUploading={isUploading?.(attachment) ?? attachment.uploading}
                album
                fill
                onDownload={!isVisual ? () => { void onDownload(attachment); } : undefined}
              />
              {showOverflow ? (
                <div
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/55 text-2xl font-semibold tracking-wide text-white"
                  aria-hidden
                >
                  +{overflow}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {albumOverlay ? (
        <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-20">
          {albumOverlay}
        </div>
      ) : null}
    </div>
  );
};

export const isMediaAlbumEligible = (
  attachments: ChatAttachment[],
  resolveKind: (attachment: ChatAttachment, url: string) => FileFormatKind,
): boolean => {
  if (attachments.length < 2) return false;
  return attachments.every((attachment) => {
    const url = attachment.url || attachment.tempUrl || '';
    const kind = resolveKind(attachment, url);
    return kind === 'image' || kind === 'video';
  });
};

export default MediaAlbumGrid;
