import { useState, useEffect, useCallback, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import ImageViewerIcon from '@/components/ui/image-viewer/ImageViewerIcons';
import {
  RetryableMediaImage,
  RetryableMediaVideo,
} from '@/components/ui/media/RetryableMedia';
import { getMediaKindFromFile, getMediaDisplayName, isGifFile } from '@/utils/fileFormat';
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

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_IN_TARGET = 2.5;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const getTouchDist = (t: TouchList) =>
  Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

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
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);
  const [entered, setEntered] = useState(false);

  // Always-current values readable inside non-reactive event handlers
  const live = useRef({ scale: 1, tx: 0, ty: 0 });

  // Gesture state
  const gestureRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ initDist: number; initScale: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initTx: number; initTy: number } | null>(null);
  const lastTapRef = useRef(0);

  const currentMedia = mediaFiles[currentIndex];
  const mediaKind = getMediaKindFromFile(currentMedia) as MediaKind;
  const displayName = getMediaDisplayName(currentMedia);
  const currentIsGif = isGifFile(currentMedia?.url, currentMedia?.name);
  const isVideo = mediaKind === 'video';
  const isAudio = mediaKind === 'audio';
  const canReply = Boolean(chatId && currentMedia?.messageId);

  const applyScale = useCallback((next: number, resetTranslate = false) => {
    const s = clamp(next, MIN_SCALE, MAX_SCALE);
    live.current.scale = s;
    if (resetTranslate || s <= MIN_SCALE) {
      live.current.tx = 0;
      live.current.ty = 0;
      setTranslate({ x: 0, y: 0 });
    }
    setScale(s);
  }, []);

  const resetZoom = useCallback(() => {
    live.current = { scale: 1, tx: 0, ty: 0 };
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setIsGesturing(false);
  }, []);

  useEffect(() => { setCurrentIndex(initialIndex); resetZoom(); }, [initialIndex, resetZoom]);
  useEffect(() => { resetZoom(); }, [currentIndex, resetZoom]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaFiles.length - 1));
  }, [mediaFiles.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < mediaFiles.length - 1 ? prev + 1 : 0));
  }, [mediaFiles.length]);

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

  // ── Non-passive gesture listeners (wheel + touch) ────────────────────────
  useEffect(() => {
    const el = gestureRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      // Normalize across pixel/line/page delta modes
      const px = e.deltaMode === 0 ? e.deltaY : e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY * 100;
      applyScale(live.current.scale * (1 - px * 0.004));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = { initDist: getTouchDist(e.touches), initScale: live.current.scale };
        dragRef.current = null;
      } else if (e.touches.length === 1) {
        // Double-tap detection
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          e.preventDefault();
          applyScale(live.current.scale > MIN_SCALE ? MIN_SCALE : ZOOM_IN_TARGET, true);
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
        // Pan when zoomed
        if (live.current.scale > MIN_SCALE) {
          dragRef.current = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            initTx: live.current.tx,
            initTy: live.current.ty,
          };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        setIsGesturing(true);
        const ratio = getTouchDist(e.touches) / pinchRef.current.initDist;
        applyScale(pinchRef.current.initScale * ratio);
      } else if (e.touches.length === 1 && dragRef.current && live.current.scale > MIN_SCALE) {
        e.preventDefault();
        setIsGesturing(true);
        const tx = dragRef.current.initTx + (e.touches[0].clientX - dragRef.current.startX);
        const ty = dragRef.current.initTy + (e.touches[0].clientY - dragRef.current.startY);
        live.current.tx = tx;
        live.current.ty = ty;
        setTranslate({ x: tx, y: ty });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null;
      if (e.touches.length === 0) {
        dragRef.current = null;
        setIsGesturing(false);
        // Snap back to 1 if barely zoomed
        if (live.current.scale < 1.08) {
          applyScale(MIN_SCALE, true);
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  // re-attach whenever the displayed media changes (gesture div remounts for images)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyScale, currentIndex]);

  // ── Mouse drag (desktop pan when zoomed) ─────────────────────────────────
  const onMouseDown = useCallback((e: ReactMouseEvent) => {
    if (live.current.scale <= MIN_SCALE) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initTx: live.current.tx,
      initTy: live.current.ty,
    };
    setIsGesturing(true);
  }, []);

  const onMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!dragRef.current) return;
    const tx = dragRef.current.initTx + (e.clientX - dragRef.current.startX);
    const ty = dragRef.current.initTy + (e.clientY - dragRef.current.startY);
    live.current.tx = tx;
    live.current.ty = ty;
    setTranslate({ x: tx, y: ty });
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    setIsGesturing(false);
  }, []);

  const renderMedia = () => {
    if (!currentMedia?.url) return null;
    if (isVideo) {
      return (
        <RetryableMediaVideo
          key={currentMedia.url}
          url={currentMedia.url}
          wrapperClassName="flex w-full max-w-full items-center justify-center"
          className="max-h-[min(78dvh,680px)] max-w-full rounded-2xl object-contain shadow-[0_24px_64px_rgba(0,0,0,0.6)] sm:max-h-[min(68vh,680px)]"
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
        className="flex min-h-[min(60vh,580px)] w-full max-w-full items-center justify-center overflow-hidden"
        style={{ cursor: scale > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'default' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <RetryableMediaImage
          key={currentMedia.url}
          url={currentMedia.url}
          transformWidth={currentIsGif ? undefined : 1400}
          alt={displayName}
          wrapperClassName="flex w-full max-w-full items-center justify-center"
          className="max-h-[min(78dvh,680px)] max-w-full select-none rounded-2xl object-contain shadow-[0_24px_72px_rgba(0,0,0,0.55)] sm:max-h-[min(68vh,680px)]"
          fallbackIconClassName={galleryFallbackIconClass}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isGesturing ? 'none' : 'transform 0.2s ease',
            transformOrigin: 'center center',
          }}
          onDoubleClick={() => applyScale(scale > MIN_SCALE ? MIN_SCALE : ZOOM_IN_TARGET, true)}
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
