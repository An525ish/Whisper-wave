import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ImageViewerIcon from '@/components/ui/image-viewer/ImageViewerIcons';
import {
  RetryableMediaImage,
  RetryableMediaVideo,
} from '@/components/ui/media/RetryableMedia';
import { getMediaKindFromFile, getMediaDisplayName } from '@/utils/fileFormat';
import ImageViewerToolbar from '@/components/ui/image-viewer/ImageViewerToolbar';
import ImageViewerNav from '@/components/ui/image-viewer/ImageViewerNav';

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

  const resetZoom = useCallback(() => setScale(1), []);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetZoom();
  }, [initialIndex, resetZoom]);

  useEffect(() => { resetZoom(); }, [currentIndex, resetZoom]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaFiles.length - 1));
  }, [mediaFiles.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < mediaFiles.length - 1 ? prev + 1 : 0));
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
              <img src={currentMedia.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageViewerIcon name="music" className="h-20 w-20 fill-body-300" />
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
        onDoubleClick={() => setScale((prev) => (prev === 1 ? 2 : 1))}
        draggable={false}
      />
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5"
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

        <ImageViewerToolbar
          currentMedia={currentMedia}
          mediaKind={mediaKind}
          currentIndex={currentIndex}
          totalCount={mediaFiles.length}
          hasMultiple={mediaFiles.length > 1}
          onClose={onClose}
        />

        {mediaFiles.length === 0 ? (
          <div className="grid flex-1 place-items-center px-6">
            <div className="text-center">
              <img src="/images/no-media.svg" alt="" className="mx-auto w-36 opacity-45" />
              <p className="mt-4 text-sm text-body-300">No media found</p>
            </div>
          </div>
        ) : (
          <ImageViewerNav
            mediaFiles={mediaFiles}
            currentIndex={currentIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            onSelect={setCurrentIndex}
          >
            {renderMedia()}
          </ImageViewerNav>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default ImageViewer;
