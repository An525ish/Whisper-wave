import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ImageViewerIcon from '@/shared/components/ui/image-viewer/ImageViewerIcons';
import {
  RetryableMediaImage,
  RetryableMediaVideo,
} from '@/shared/components/ui/media/RetryableMedia';
import { getMediaKindFromFile, getMediaDisplayName, isGifFile } from '@/shared/utils/fileFormat';
import ImageViewerToolbar from '@/shared/components/ui/image-viewer/ImageViewerToolbar';
import ImageViewerNav from '@/shared/components/ui/image-viewer/ImageViewerNav';
import type { MediaFile } from '@/shared/types/media';
import { useImageViewerZoom } from './useImageViewerZoom';

// Re-export for callers that import from here
export type { MediaFile };

type ImageViewerProps = {
  mediaFiles?: MediaFile[];
  initialIndex: number;
  onClose: () => void;
  /** Called with the current file when the user clicks Delete */
  onDelete?: (file: MediaFile) => void;
  /** Called with the current file when the user clicks Forward */
  onForward?: (file: MediaFile) => void;
  /**
   * When provided, an inline composer/footer is rendered at the bottom of the
   * viewer for the current file. Kept as a render prop so the shared viewer
   * stays domain-agnostic — the chat feature supplies the reply bar.
   */
  renderReplyBar?: (file: MediaFile) => ReactNode;
};

type MediaKind = 'image' | 'video' | 'audio';

const galleryFallbackIconClass = 'h-36 w-36 sm:h-44 sm:w-44';

const ImageViewer = ({
  mediaFiles = [],
  initialIndex,
  onClose,
  onDelete,
  onForward,
  renderReplyBar,
}: ImageViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [entered, setEntered] = useState(false);
  const { gestureRef, scale, translate, isGesturing, resetZoom } = useImageViewerZoom({
    initialIndex,
    currentIndex,
  });

  const currentMedia = mediaFiles[currentIndex];
  const mediaKind = getMediaKindFromFile(currentMedia) as MediaKind;
  const displayName = getMediaDisplayName(currentMedia);
  const currentIsGif = isGifFile(currentMedia?.url, currentMedia?.name);
  const isVideo = mediaKind === 'video';
  const isAudio = mediaKind === 'audio';
  const replyBar = currentMedia && renderReplyBar ? renderReplyBar(currentMedia) : undefined;

  // Sync when parent opens viewer at a different index — render-time adjustment, not an effect.
  const [prevInitialIndex, setPrevInitialIndex] = useState(initialIndex);
  if (initialIndex !== prevInitialIndex) {
    setPrevInitialIndex(initialIndex);
    setCurrentIndex(initialIndex);
  }

  const selectIndex = useCallback(
    (index: number) => {
      resetZoom();
      setCurrentIndex(index);
    },
    [resetZoom],
  );

  const handlePrev = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaFiles.length - 1));
  }, [mediaFiles.length, resetZoom]);

  const handleNext = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev < mediaFiles.length - 1 ? prev + 1 : 0));
  }, [mediaFiles.length, resetZoom]);

  // ── Keyboard + body scroll lock ───────────────────────────────────────────
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [handlePrev, handleNext, onClose]);

  const renderMedia = () => {
    if (!currentMedia?.url) return null;
    if (isVideo) {
      return (
        <RetryableMediaVideo
          key={currentMedia.url}
          url={currentMedia.url}
          wrapperClassName="flex h-full max-h-full w-full max-w-full items-center justify-center"
          className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
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
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-primary px-8 py-10 ring-1 ring-border/60">
          <div className="mb-6 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-background shadow-[0_0_48px_rgba(1,195,109,0.18)] ring-1 ring-green/20">
            {currentMedia.thumbnailUrl ? (
              <img src={currentMedia.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageViewerIcon name="music" className="h-20 w-20 fill-body-300" />
            )}
          </div>
          <audio src={currentMedia.url} controls className="w-full" autoPlay />
          <p className="mt-5 truncate text-center text-sm font-medium text-body-700">
            {displayName}
          </p>
        </div>
      );
    }
    return (
      // Gesture container — non-passive listeners attached via useEffect
      <div
        ref={gestureRef}
        className="flex h-full max-h-full w-full max-w-full items-center justify-center overflow-hidden"
        style={{ cursor: scale > 1 ? (isGesturing ? 'grabbing' : 'grab') : 'default' }}
      >
        <RetryableMediaImage
          key={currentMedia.url}
          url={currentMedia.url}
          transformWidth={currentIsGif ? undefined : 1400}
          alt={displayName}
          wrapperClassName="flex h-full max-h-full w-full max-w-full items-center justify-center"
          className="max-h-full max-w-full select-none rounded-2xl object-contain shadow-[0_24px_72px_rgba(0,0,0,0.55)]"
          fallbackIconClassName={galleryFallbackIconClass}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isGesturing ? 'none' : 'transform 0.2s ease',
            transformOrigin: 'center center',
          }}
          draggable={false}
        />
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Media gallery"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close gallery"
        className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal shell */}
      <div
        className={`relative flex h-[min(96dvh,calc(100dvh-1rem))] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-background shadow-[0_48px_100px_rgba(0,0,0,0.7)] ring-1 ring-border/50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          entered ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient green glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(1,195,109,0.09),transparent_80%)]"
          aria-hidden
        />

        <ImageViewerToolbar
          currentMedia={currentMedia}
          onClose={onClose}
          onDelete={onDelete && currentMedia ? () => onDelete(currentMedia) : undefined}
          onForward={onForward && currentMedia ? () => onForward(currentMedia) : undefined}
        />

        {mediaFiles.length === 0 ? (
          <div className="grid flex-1 place-items-center px-6">
            <div className="text-center">
              <img src="/images/no-media.svg" alt="" className="mx-auto w-36 opacity-30" />
              <p className="mt-4 text-sm text-body-300">No media found</p>
            </div>
          </div>
        ) : (
          <ImageViewerNav
            mediaFiles={mediaFiles}
            currentIndex={currentIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            onSelect={selectIndex}
            replyBar={replyBar}
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

