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
      strokeWidth="1.75"
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
  /** The media renderer rendered inside the nav area. */
  children: ReactNode;
};

/**
 * Wraps the media area with prev/next arrows and renders the thumbnail strip below.
 * Owns the outer `mx-4` container so arrows can be absolutely positioned within it.
 */
const ImageViewerNav = ({
  mediaFiles,
  currentIndex,
  onPrev,
  onNext,
  onSelect,
  children,
}: ImageViewerNavProps) => {
  const hasMultiple = mediaFiles.length > 1;

  return (
    <>
      <div className="relative mx-4 flex min-h-0 flex-1 items-stretch overflow-hidden rounded-2xl bg-black/40 ring-1 ring-inset ring-white/6 sm:mx-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(1,195,109,0.06),transparent_68%)]"
          aria-hidden
        />

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/75 text-white shadow-lg backdrop-blur-sm transition hover:border-green/40 hover:bg-background sm:left-4"
              aria-label="Previous"
            >
              <ChevronIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/75 text-white shadow-lg backdrop-blur-sm transition hover:border-green/40 hover:bg-background sm:right-4"
              aria-label="Next"
            >
              <ChevronIcon className="h-5 w-5 rotate-180" />
            </button>
          </>
        ) : null}

        <div className="relative flex h-full min-h-[70vh] w-full items-center justify-center px-14 py-8 sm:px-16">
          {children}
        </div>
      </div>

      {hasMultiple ? (
        <footer className="shrink-0 border-t border-border/50 bg-background-alt/30 px-5 py-4 sm:px-6">
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-body-300">
            All media
          </p>
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {mediaFiles.map((item, index) => {
              const thumbKind = getMediaKindFromFile(item);
              const active = index === currentIndex;

              return (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => onSelect(index)}
                  className={`relative h-17 w-19 shrink-0 snap-start overflow-hidden rounded-xl transition duration-200 ${
                    active
                      ? 'ring-2 ring-green shadow-[0_0_20px_rgba(1,195,109,0.28)]'
                      : 'opacity-45 ring-1 ring-border/50 hover:opacity-75'
                  }`}
                  aria-label={`View item ${index + 1}`}
                  aria-current={active}
                >
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
                    <div className="flex h-full w-full items-center justify-center bg-primary">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageViewerIcon name="music" className="h-6 w-6 fill-body-300" />
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
                  {active ? (
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-green" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </footer>
      ) : null}
    </>
  );
};

export default ImageViewerNav;
