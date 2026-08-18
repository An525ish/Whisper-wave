import type { AdminMessageAttachment } from '@/types/admin';
import {
  RetryableMediaImage,
  RetryableMediaVideo,
} from '@/components/ui/media/RetryableMedia';
import {
  isImageAttachment,
  isVideoAttachment,
  messageAttachmentLabel,
} from '@/utils/admin/messages';
import {
  ADMIN_MEDIA_CHIP_FAILED_ILLUSTRATION,
  ADMIN_MEDIA_CHIP_LOADING_ICON,
} from '@/constants/admin/attachments';

type AttachmentChipProps = {
  att: AdminMessageAttachment;
  onImageClick?: () => void;
};

const chipButtonClass =
  'group relative block h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-primary/30 transition hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-green/45';

const mediaClass = 'h-full w-full object-cover transition group-hover:scale-105';

const AttachmentChip = ({ att, onImageClick }: AttachmentChipProps) => {
  const isImage = isImageAttachment(att);
  const isVideo = isVideoAttachment(att);

  if (isImage && att.url) {
    return (
      <button
        type="button"
        onClick={() => onImageClick?.()}
        className={chipButtonClass}
        title={`View ${att.name ?? 'image'}`}
      >
        <RetryableMediaImage
          url={att.url}
          alt={att.name ?? 'image'}
          transformWidth={224}
          className={mediaClass}
          wrapperClassName="h-full w-full"
          fallbackIconClassName={ADMIN_MEDIA_CHIP_LOADING_ICON}
          failedIllustrationClassName={ADMIN_MEDIA_CHIP_FAILED_ILLUSTRATION}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
          <svg
            className="h-6 w-6 text-white opacity-0 drop-shadow transition group-hover:opacity-100"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M10 3a7 7 0 100 14A7 7 0 0010 3zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm0 2.5a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
        </span>
      </button>
    );
  }

  if (isVideo && att.url) {
    return (
      <button
        type="button"
        onClick={() => onImageClick?.()}
        className={chipButtonClass}
        title={`View ${att.name ?? 'video'}`}
      >
        <RetryableMediaVideo
          url={att.url}
          className={mediaClass}
          wrapperClassName="h-full w-full"
          fallbackIconClassName={ADMIN_MEDIA_CHIP_LOADING_ICON}
          failedIllustrationClassName={ADMIN_MEDIA_CHIP_FAILED_ILLUSTRATION}
          preload="metadata"
          muted
          playsInline
        />
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25"
          aria-hidden
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white ring-1 ring-white/20">
            <svg viewBox="0 0 20 20" className="ml-0.5 h-4 w-4 fill-current" aria-hidden>
              <path d="M6 4.5v11l9-5.5-9-5.5z" />
            </svg>
          </span>
        </span>
      </button>
    );
  }

  const icon = isVideo ? '▶' : '📎';
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-48 items-center gap-2 rounded-xl border border-border/50 bg-primary/30 px-3 py-2 text-xs font-medium text-body-300 transition hover:border-border/80 hover:text-body"
      title={att.name}
    >
      <span className="text-sm">{icon}</span>
      <span className="truncate">{messageAttachmentLabel(att)}</span>
    </a>
  );
};

export default AttachmentChip;
