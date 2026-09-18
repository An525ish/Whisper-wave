import { type ReactNode } from 'react';
import ImageViewerIcon from '@/components/ui/image-viewer/ImageViewerIcons';
import {
  RetryableMediaImage,
  RetryableMediaVideo,
} from '@/components/ui/media/RetryableMedia';
import { getMediaKindFromFile } from '@/utils/fileFormat';
import type { MediaFile } from '@/types/media';

const galleryThumbFallbackIconClass = 'h-9 w-9';

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
  const totalCount = mediaFiles.length;

  return (
    <>
      {/* Main media area — full bleed, reply bar floats over the bottom */}
      <div className="relative flex min-h-0 flex-1 items-stretch overflow-hidden bg-black-dark/70">
        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.4)_100%)]"
          aria-hidden
        />

        {/* Counter pill — top-right, always visible when multiple */}
        {hasMultiple ? (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-0.5 text-xs tabular-nums text-white/80 ring-1 ring-white/10 backdrop-blur-sm">
            {currentIndex + 1}&thinsp;/&thinsp;{totalCount}
          </span>
        ) : null}

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/70 bg-background/80 text-body-300 shadow-lg backdrop-blur-sm transition-all duration-150 hover:border-green-light hover:text-green active:scale-95 sm:left-4"
              aria-label="Previous"
            >
              <ChevronIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/70 bg-background/80 text-body-300 shadow-lg backdrop-blur-sm transition-all duration-150 hover:border-green-light hover:text-green active:scale-95 sm:right-4"
              aria-label="Next"
            >
              <ChevronIcon className="h-5 w-5 rotate-180" />
            </button>
          </>
        ) : null}

        <div
          className={`relative flex h-full min-h-[65vh] w-full flex-1 items-center justify-center px-2 py-3 sm:px-20 sm:py-6 ${
            replyBar ? 'pb-20' : ''
          }`}
        >
          {children}
        </div>

        {replyBar ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black-dark via-black-dark/75 to-transparent px-6 pb-6 pt-14">
            <div className="pointer-events-auto mx-auto w-full max-w-lg">
              {replyBar}
            </div>
          </div>
        ) : null}
      </div>

      {/* Thumbnail strip */}
      {hasMultiple ? (
        <footer className="shrink-0 border-t border-border/60 bg-primary/60 px-0 py-2 backdrop-blur-sm">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 px-3 py-1">
              {mediaFiles.map((item, index) => {
                const thumbKind = getMediaKindFromFile(item);
                const active = index === currentIndex;

                return (
                  <button
                    type="button"
                    key={item._id}
                    onClick={() => onSelect(index)}
                    className={`relative h-14 w-16 shrink-0 snap-start overflow-hidden rounded-lg transition-opacity duration-200 ${
                      active
                        ? 'border-2 border-green'
                        : 'border-2 border-transparent opacity-40 hover:opacity-70'
                    }`}
                    aria-label={`View item ${index + 1}`}
                    aria-current={active}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[6px]">
                      {thumbKind === 'video' ? (
                        <RetryableMediaVideo
                          url={item.url}
                          className="h-full w-full object-cover"
                          fallbackIconClassName={galleryThumbFallbackIconClass}
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : thumbKind === 'audio' ? (
                        <div className="flex h-full w-full items-center justify-center bg-white/5">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageViewerIcon name="music" className="h-5 w-5 fill-white/40" />
                          )}
                        </div>
                      ) : (
                        <RetryableMediaImage
                          url={item.url}
                          transformWidth={280}
                          alt={item.name ?? ''}
                          className="h-full w-full object-cover"
                          fallbackIconClassName={galleryThumbFallbackIconClass}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </footer>
      ) : null}
    </>
  );
};

export default ImageViewerNav;
