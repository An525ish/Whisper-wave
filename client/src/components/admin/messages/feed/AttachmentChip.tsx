import type { AdminMessageAttachment } from '@/types/admin';
import {
  isImageAttachment,
  isVideoAttachment,
  messageAttachmentLabel,
} from '@/utils/admin/messages';

type AttachmentChipProps = {
  att: AdminMessageAttachment;
  onImageClick?: () => void;
};

const AttachmentChip = ({ att, onImageClick }: AttachmentChipProps) => {
  const isImage = isImageAttachment(att);
  const isVideo = isVideoAttachment(att);

  if (isImage && att.url) {
    return (
      <button
        type="button"
        onClick={() => onImageClick?.()}
        className="group relative block h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-primary/30 transition hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-green/45"
        title={`View ${att.name ?? 'image'}`}
      >
        <img
          src={att.url}
          alt={att.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
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
