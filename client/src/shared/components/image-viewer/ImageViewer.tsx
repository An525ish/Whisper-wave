import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ImageViewerIcon from './ImageViewerIcons';
import {
  RetryableMediaImage,
  RetryableMediaVideo,
} from '@/shared/components/media/RetryableMedia';
import { getMediaKindFromFile, getMediaDisplayName } from '@/shared/utils/fileFormat';
import toast from 'react-hot-toast';

export type MediaFile = {
  _id: string;
  url: string;
  name?: string;
  publicId?: string;
  thumbnailUrl?: string;
  fileType?: string;
};

type ImageViewerProps = {
  mediaFiles?: MediaFile[];
  initialIndex: number;
  onClose: () => void;
};

type MediaKind = 'image' | 'video' | 'audio';

const galleryFallbackIconClass = 'h-36 w-36 sm:h-44 sm:w-44';
const galleryThumbFallbackIconClass = 'h-9 w-9';

const mediaTypeLabel = (kind: MediaKind) => {
  if (kind === 'video') return 'Video';
  if (kind === 'audio') return 'Audio';
  return 'Photo';
};

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

const ImageViewer = ({
  mediaFiles = [],
  initialIndex,
  onClose,
}: ImageViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [entered, setEntered] = useState(false);

  const currentMedia = mediaFiles[currentIndex];
  const mediaKind = getMediaKindFromFile(currentMedia) as MediaKind;
  const displayName = getMediaDisplayName(currentMedia);
  const isVideo = mediaKind === 'video';
  const isAudio = mediaKind === 'audio';
  const hasMultiple = mediaFiles.length > 1;

  const resetZoom = useCallback(() => {
    setScale(1);
  }, []);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetZoom();
  }, [initialIndex, resetZoom]);

  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) =>
      prev > 0 ? prev - 1 : mediaFiles.length - 1,
    );
  }, [mediaFiles.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) =>
      prev < mediaFiles.length - 1 ? prev + 1 : 0,
    );
  }, [mediaFiles.length]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrev, handleNext, onClose]);

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

  const handleDoubleClick = () => {
    setScale((prev) => (prev === 1 ? 2 : 1));
  };

  const renderMedia = () => {
    if (!currentMedia?.url) return null;

    if (isVideo) {
      return (
        <RetryableMediaVideo
          key={currentMedia.url}
          url={currentMedia.url}
          wrapperClassName="flex min-h-[min(64vh,640px)] w-full max-w-full items-center justify-center rounded-xl"
          className="max-h-[min(72vh,720px)] max-w-full rounded-xl object-contain shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          fallbackIconClassName={galleryFallbackIconClass}
          controls
          playsInline
          autoPlay
          muted={false}
        />
      );
    }

    if (isAudio) {
      return (
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-primary/50 px-8 py-10 ring-1 ring-white/10">
          <div className="mb-6 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-background-alt shadow-[0_0_48px_rgba(1,195,109,0.15)] ring-1 ring-green/20">
            {currentMedia.thumbnailUrl ? (
              <img
                src={currentMedia.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageViewerIcon
                name="music"
                className="h-20 w-20 fill-body-300"
              />
            )}
          </div>
          <audio src={currentMedia.url} controls className="w-full" autoPlay />
          <p className="mt-5 truncate text-center text-sm font-medium text-white">
            {displayName}
          </p>
        </div>
      );
    }

    return (
      <RetryableMediaImage
        key={currentMedia.url}
        url={currentMedia.url}
        transformWidth={1400}
        alt={displayName}
        wrapperClassName="flex min-h-[min(64vh,640px)] w-full max-w-full items-center justify-center rounded-xl"
        className="max-h-[min(72vh,720px)] max-w-full select-none rounded-xl object-contain shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        fallbackIconClassName={galleryFallbackIconClass}
        style={{ transform: `scale(${scale})` }}
        onDoubleClick={handleDoubleClick}
        draggable={false}
      />
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Media gallery"
    >
      <button
        type="button"
        aria-label="Close gallery"
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative flex h-[min(96dvh,calc(100dvh-0.75rem))] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-background/95 shadow-[0_32px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          entered ? 'scale-100 opacity-100' : 'scale-[0.96] opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-12 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.12),transparent_72%)]"
          aria-hidden
        />

        <header className="relative flex shrink-0 items-center gap-3 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-green/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green ring-1 ring-green/25">
                {mediaTypeLabel(mediaKind)}
              </span>
              {hasMultiple ? (
                <span className="rounded-full bg-background-alt/80 px-2.5 py-0.5 text-[11px] tabular-nums text-body-300 ring-1 ring-border/50">
                  {currentIndex + 1} / {mediaFiles.length}
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
                onClick={handleDownload}
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

        {mediaFiles.length === 0 ? (
          <div className="grid flex-1 place-items-center px-6">
            <div className="text-center">
              <img
                src="/images/no-media.svg"
                alt=""
                className="mx-auto w-36 opacity-45"
              />
              <p className="mt-4 text-sm text-body-300">No media found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mx-4 flex min-h-0 flex-1 items-stretch overflow-hidden rounded-2xl bg-black/40 ring-1 ring-inset ring-white/[0.06] sm:mx-6">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(1,195,109,0.06),transparent_68%)]"
                aria-hidden
              />

              {hasMultiple ? (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/75 text-white shadow-lg backdrop-blur-sm transition hover:border-green/40 hover:bg-background sm:left-4"
                    aria-label="Previous"
                  >
                    <ChevronIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/75 text-white shadow-lg backdrop-blur-sm transition hover:border-green/40 hover:bg-background sm:right-4"
                    aria-label="Next"
                  >
                    <ChevronIcon className="h-5 w-5 rotate-180" />
                  </button>
                </>
              ) : null}

              <div className="relative flex h-full min-h-[70vh] w-full items-center justify-center px-14 py-8 sm:px-16">
                {renderMedia()}
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
                        onClick={() => setCurrentIndex(index)}
                        className={`relative h-[4.25rem] w-[4.75rem] shrink-0 snap-start overflow-hidden rounded-xl transition duration-200 ${
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
                              <img
                                src={item.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageViewerIcon
                                name="music"
                                className="h-6 w-6 fill-body-300"
                              />
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
        )}
      </div>
    </div>,
    document.body,
  );
};

export default ImageViewer;
