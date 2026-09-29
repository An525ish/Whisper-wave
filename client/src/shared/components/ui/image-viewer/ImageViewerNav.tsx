import { type ReactNode } from 'react';
import GalleryThumbStrip from '@/shared/components/ui/image-viewer/GalleryThumbStrip';
import type { MediaFile } from '@/shared/types/media';
import { cn } from '@/shared/utils/cn';

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M12.5 4.5L7 10l5.5 5.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type NavArrowButtonProps = {
  direction: 'prev' | 'next';
  onClick: () => void;
};

const NAV_ARROW_CLASS =
  'absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/70 bg-background/80 text-body-300 shadow-lg backdrop-blur-sm transition-all duration-150 hover:border-green-light hover:text-green active:scale-95';

const NavArrowButton = ({ direction, onClick }: NavArrowButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      NAV_ARROW_CLASS,
      direction === 'prev' ? 'left-3 sm:left-4' : 'right-3 sm:right-4',
    )}
    aria-label={direction === 'prev' ? 'Previous' : 'Next'}
  >
    <ChevronIcon className={cn('h-5 w-5', direction === 'next' && 'rotate-180')} />
  </button>
);

type ImageViewerNavProps = {
  mediaFiles: MediaFile[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  children: ReactNode;
  replyBar?: ReactNode;
};

const ImageViewerNav = ({
  mediaFiles,
  currentIndex,
  onPrev,
  onNext,
  onSelect,
  children,
  replyBar,
}: ImageViewerNavProps) => {
  const hasMultiple = mediaFiles.length > 1;

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black-dark/70">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.4)_100%)]"
          aria-hidden
        />

        {hasMultiple ? (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-0.5 text-xs tabular-nums text-white/80 ring-1 ring-white/10 backdrop-blur-sm">
            {currentIndex + 1}&thinsp;/&thinsp;{mediaFiles.length}
          </span>
        ) : null}

        {hasMultiple ? (
          <>
            <NavArrowButton direction="prev" onClick={onPrev} />
            <NavArrowButton direction="next" onClick={onNext} />
          </>
        ) : null}

        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center px-2 py-3 sm:px-20 sm:py-4">
          {children}
        </div>

        {replyBar ? (
          <div className="shrink-0 border-t border-white/8 bg-black-dark/95 px-4 py-3 sm:px-6">
            <div className="mx-auto w-full max-w-lg">{replyBar}</div>
          </div>
        ) : null}
      </div>

      {hasMultiple ? (
        <GalleryThumbStrip
          mediaFiles={mediaFiles}
          currentIndex={currentIndex}
          onSelect={onSelect}
        />
      ) : null}
    </>
  );
};

export default ImageViewerNav;
