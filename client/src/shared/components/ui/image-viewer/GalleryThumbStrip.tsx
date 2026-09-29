import { useEffect, useRef } from 'react';
import ImageViewerIcon from '@/shared/components/ui/image-viewer/ImageViewerIcons';
import MediaPlaceholder from '@/shared/components/ui/media/MediaPlaceholder';
import {
  useRetryableMediaSrc,
  type RetryableMediaKind,
} from '@/shared/hooks/useRetryableMediaSrc';
import type { MediaFile } from '@/shared/types/media';
import { getMediaKindFromFile, isGifFile } from '@/shared/utils/fileFormat';
import { cn } from '@/shared/utils/cn';

const THUMB_FRAME = 'size-[52px] sm:size-[60px]';
const THUMB_ICON = 'h-6 w-6 sm:h-7 sm:w-7';
const THUMB_MEDIA =
  'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-200 motion-reduce:transition-none';

type GalleryThumbStripProps = {
  mediaFiles: MediaFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
};

type ThumbPlaceholderProps = {
  kind: RetryableMediaKind;
  variant: 'loading' | 'retrying' | 'failed';
  label: string;
};

const ThumbPlaceholder = ({ kind, variant, label }: ThumbPlaceholderProps) => (
  <MediaPlaceholder
    kind={kind}
    variant={variant}
    className="absolute inset-0"
    iconClassName={THUMB_ICON}
    aria-label={label}
  />
);

const PlayBadge = () => (
  <span
    className="pointer-events-none absolute bottom-1 right-1 z-2 grid h-4 w-4 place-items-center rounded-full bg-black/70 ring-1 ring-white/15 sm:h-5 sm:w-5"
    aria-hidden
  >
    <svg className="h-2 w-2 fill-white sm:h-2.5 sm:w-2.5" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  </span>
);

type GalleryThumbCoverMediaProps = {
  url: string;
  kind: RetryableMediaKind;
  alt?: string;
};

/** Fixed-frame cover media for gallery thumbs — bypasses RetryableMedia wrapper sizing. */
const GalleryThumbCoverMedia = ({ url, kind, alt = '' }: GalleryThumbCoverMediaProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isGif = kind === 'image' && isGifFile(url);
  const { src, showFallback, isLoading, isRetrying, handleLoad, handleError } =
    useRetryableMediaSrc({
      url,
      kind,
      transformWidth: kind === 'image' && !isGif ? 160 : undefined,
    });

  useEffect(() => {
    if (kind !== 'video') return;
    const video = videoRef.current;
    if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      handleLoad();
    }
  }, [kind, src, handleLoad]);

  if (showFallback) {
    return (
      <ThumbPlaceholder
        kind={kind}
        variant={isRetrying ? 'retrying' : 'failed'}
        label={`${kind} thumbnail unavailable`}
      />
    );
  }

  const mediaClass = cn(THUMB_MEDIA, isLoading ? 'opacity-0' : 'opacity-100');

  return (
    <>
      {isLoading ? (
        <ThumbPlaceholder kind={kind} variant="loading" label={`Loading ${kind} thumbnail`} />
      ) : null}
      {kind === 'video' ? (
        <video
          ref={videoRef}
          src={src}
          className={mediaClass}
          muted
          playsInline
          preload="metadata"
          draggable={false}
          onLoadedData={handleLoad}
          onError={handleError}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className={mediaClass}
          decoding="async"
          draggable={false}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </>
  );
};

const AudioThumbFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-violet-600/25 to-black/70">
    <ImageViewerIcon name="music" className={cn(THUMB_ICON, 'fill-white/45')} />
  </div>
);

const GalleryThumbContent = ({ item }: { item: MediaFile }) => {
  const kind = getMediaKindFromFile(item);

  if (kind === 'video') {
    const posterUrl = item.thumbnailUrl;
    return (
      <>
        <GalleryThumbCoverMedia
          url={posterUrl ?? item.url}
          kind={posterUrl ? 'image' : 'video'}
          alt={item.name ?? ''}
        />
        <PlayBadge />
      </>
    );
  }

  if (kind === 'audio') {
    if (item.thumbnailUrl) {
      return <GalleryThumbCoverMedia url={item.thumbnailUrl} kind="image" alt={item.name ?? ''} />;
    }
    return <AudioThumbFallback />;
  }

  return <GalleryThumbCoverMedia url={item.url} kind="image" alt={item.name ?? ''} />;
};

type GalleryThumbProps = {
  item: MediaFile;
  index: number;
  active: boolean;
  onSelect: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
};

const GalleryThumb = ({ item, index, active, onSelect, buttonRef }: GalleryThumbProps) => (
  <button
    type="button"
    ref={buttonRef}
    onClick={onSelect}
    className={cn(
      'relative shrink-0 snap-center rounded-lg border-0 bg-transparent p-0 transition-opacity duration-200',
      active
        ? 'z-1 opacity-100 ring-2 ring-green ring-offset-2 ring-offset-black-dark'
        : 'opacity-40 hover:opacity-70',
    )}
    aria-label={`View item ${index + 1}`}
    aria-current={active}
  >
    <span className={cn('relative block overflow-hidden rounded-md bg-black/60', THUMB_FRAME)}>
      <GalleryThumbContent item={item} />
    </span>
  </button>
);

const GalleryThumbStrip = ({ mediaFiles, currentIndex, onSelect }: GalleryThumbStripProps) => {
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    thumbRefs.current[currentIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [currentIndex]);

  return (
    <footer className="relative shrink-0 border-t border-white/8 bg-black-dark/90 py-3 backdrop-blur-md">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-1 w-6 bg-linear-to-r from-black-dark/90 to-transparent sm:w-8"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-1 w-6 bg-linear-to-l from-black-dark/90 to-transparent sm:w-8"
        aria-hidden
      />

      <div className="overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory py-0.5">
        <div className="flex min-w-min items-center justify-start gap-2.5 px-3.5 sm:justify-center sm:gap-3 sm:px-5">
          {mediaFiles.map((item, index) => (
            <GalleryThumb
              key={item._id ?? item.url ?? index}
              item={item}
              index={index}
              active={index === currentIndex}
              onSelect={() => onSelect(index)}
              buttonRef={(el) => {
                thumbRefs.current[index] = el;
              }}
            />
          ))}
        </div>
      </div>
    </footer>
  );
};

export default GalleryThumbStrip;
