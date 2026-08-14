import type { MediaFile, MediaKind } from '@/shared/types/media';
import ImageViewerIcon from './ImageViewerIcons';
import toast from 'react-hot-toast';
import { getMediaDisplayName } from '@/shared/utils/fileFormat';

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M5 5l10 10M15 5L5 15"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

const mediaTypeLabel = (kind: MediaKind) => {
  if (kind === 'video') return 'Video';
  if (kind === 'audio') return 'Audio';
  return 'Photo';
};

type ImageViewerToolbarProps = {
  currentMedia: MediaFile | undefined;
  mediaKind: MediaKind;
  currentIndex: number;
  totalCount: number;
  hasMultiple: boolean;
  onClose: () => void;
};

const ImageViewerToolbar = ({
  currentMedia,
  mediaKind,
  currentIndex,
  totalCount,
  hasMultiple,
  onClose,
}: ImageViewerToolbarProps) => {
  const displayName = getMediaDisplayName(currentMedia);

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
    <header className="relative flex shrink-0 items-center gap-3 px-5 py-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-green/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green ring-1 ring-green/25">
            {mediaTypeLabel(mediaKind)}
          </span>
          {hasMultiple ? (
            <span className="rounded-full bg-background-alt/80 px-2.5 py-0.5 text-[11px] tabular-nums text-body-300 ring-1 ring-border/50">
              {currentIndex + 1} / {totalCount}
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 truncate text-base font-semibold text-white sm:text-lg">
          {displayName}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {currentMedia ? (
          <button
            type="button"
            onClick={() => { void handleDownload(); }}
            className="grid h-10 w-10 place-items-center rounded-full border border-border/70 bg-background-alt/50 text-body-300 transition hover:border-green/40 hover:bg-primary/80 hover:text-green"
            aria-label="Download"
          >
            <ImageViewerIcon name="download" className="h-5 w-5 fill-current" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full border border-border/70 bg-background-alt/50 text-body-300 transition hover:border-red/40 hover:bg-red-dark/40 hover:text-red"
          aria-label="Close"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default ImageViewerToolbar;
