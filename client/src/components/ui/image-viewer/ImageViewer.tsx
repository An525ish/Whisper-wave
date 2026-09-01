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
import ImageViewerReplyBar from '@/components/ui/image-viewer/ImageViewerReplyBar';
import type { MediaFile } from '@/types/media';

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
   * When provided, an inline reply composer appears at the bottom.
   * The viewer uses socket to send the reply directly — no prop drilling needed.
   */
  chatId?: string;
};

type MediaKind = 'image' | 'video' | 'audio';

const galleryFallbackIconClass = 'h-36 w-36 sm:h-44 sm:w-44';

const ImageViewer = ({
  mediaFiles = [],
  initialIndex,
  onClose,
  onDelete,
  onForward,
  chatId,
}: ImageViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [entered, setEntered] = useState(false);

  const currentMedia = mediaFiles[currentIndex];
  const mediaKind = getMediaKindFromFile(currentMedia) as MediaKind;
  const displayName = getMediaDisplayName(currentMedia);
  const isVideo = mediaKind === 'video';
  const isAudio = mediaKind === 'audio';

  // Whether to show the inline reply composer
  const canReply = Boolean(chatId && currentMedia?.messageId);

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
      // Don't steal keys when an input/textarea inside the viewer is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
          wrapperClassName="flex min-h-[min(60vh,580px)] w-full max-w-full items-center justify-center"
          className="max-h-[min(68vh,680px)] max-w-full rounded-2xl object-contain shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
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
      <RetryableMediaImage
        key={currentMedia.url}
        url={currentMedia.url}
        transformWidth={1400}
        alt={displayName}
        wrapperClassName="flex min-h-[min(60vh,580px)] w-full max-w-full items-center justify-center"
        className="max-h-[min(68vh,680px)] max-w-full select-none rounded-2xl object-contain shadow-[0_24px_72px_rgba(0,0,0,0.55)]"
        fallbackIconClassName={galleryFallbackIconClass}
        style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease' }}
        onDoubleClick={() => setScale((prev) => (prev === 1 ? 2 : 1))}
        draggable={false}
      />
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
          mediaKind={mediaKind}
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
            onSelect={setCurrentIndex}
            replyBar={canReply ? (
              <ImageViewerReplyBar
                key={currentMedia!.messageId}
                chatId={chatId!}
                replyToMessageId={currentMedia!.messageId!}
              />
            ) : undefined}
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
