import type { MediaFile } from '@/types/media';
import ImageViewerIcon from '@/components/ui/image-viewer/ImageViewerIcons';
import ForwardIcon from '@/components/ui/icons/Forward';
import TrashIcon from '@/components/ui/icons/Trash';
import toast from 'react-hot-toast';
import { getMediaDisplayName } from '@/utils/fileFormat';
import { formatDateFromObjectId } from '@/utils/helpers';

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-4 w-4">
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

type ImageViewerToolbarProps = {
  currentMedia: MediaFile | undefined;
  onClose: () => void;
  onDelete?: () => void;
  onForward?: () => void;
};

const ActionBtn = ({
  onClick,
  label,
  danger = false,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`grid h-8 w-8 place-items-center rounded-full border transition-all duration-150 active:scale-95 ${
      danger
        ? 'border-red/30 text-red/70 hover:border-red/60 hover:bg-red/10 hover:text-red'
        : 'border-border text-body-300 hover:border-green-light hover:text-green'
    }`}
  >
    {children}
  </button>
);

const ImageViewerToolbar = ({
  currentMedia,
  onClose,
  onDelete,
  onForward,
}: ImageViewerToolbarProps) => {
  const displayName = getMediaDisplayName(currentMedia);
  const dateLabel = formatDateFromObjectId(currentMedia?.messageId ?? currentMedia?._id);

  const handleDownload = async () => {
    if (!currentMedia?.url) return;
    try {
      const file = await fetch(currentMedia.url);
      const blob = await file.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = displayName || 'download';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download Failed');
    }
  };

  return (
    <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-border/60 bg-primary/40 px-4 py-3 backdrop-blur-sm sm:px-5">
      {/* Close — leftmost, easy thumb reach */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close (Esc)"
        title="Close (Esc)"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-body-300 transition-all duration-150 hover:border-red/50 hover:bg-red/10 hover:text-red active:scale-95"
      >
        <CloseIcon />
      </button>

      {/* Meta — filename + date */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-body-700">{displayName}</p>
        {dateLabel ? (
          <p className="truncate text-[11px] text-body-300 sm:block">{dateLabel}</p>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {onForward ? (
          <ActionBtn onClick={onForward} label="Forward message">
            <ForwardIcon className="h-4 w-4" />
          </ActionBtn>
        ) : null}

        {currentMedia ? (
          <ActionBtn onClick={() => { void handleDownload(); }} label="Download">
            <ImageViewerIcon name="download" className="h-4 w-4 fill-current" />
          </ActionBtn>
        ) : null}

        {onDelete ? (
          <ActionBtn onClick={onDelete} label="Delete message" danger>
            <TrashIcon className="h-4 w-4" />
          </ActionBtn>
        ) : null}
      </div>
    </header>
  );
};

export default ImageViewerToolbar;
