import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_IN_TARGET = 2.5;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const getTouchDist = (t: TouchList) =>
  Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

type Params = {
  /** Zoom state resets whenever the parent re-opens the viewer at another index. */
  initialIndex: number;
  /** Gesture listeners re-attach when the displayed media changes. */
  currentIndex: number;
};

/** Pinch / wheel / double-tap / drag zoom for the media viewer. */
export const useImageViewerZoom = ({ initialIndex, currentIndex }: Params) => {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);

  // Always-current values readable inside non-reactive event handlers
  const live = useRef({ scale: 1, tx: 0, ty: 0 });

  // Gesture state
  const gestureRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ initDist: number; initScale: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initTx: number; initTy: number } | null>(null);
  const lastTapRef = useRef(0);

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

  // Reset zoom when the parent opens the viewer at a different index — render-time adjustment, not an effect.
  const [prevInitialIndex, setPrevInitialIndex] = useState(initialIndex);
  if (initialIndex !== prevInitialIndex) {
    setPrevInitialIndex(initialIndex);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setIsGesturing(false);
  }

  // Keep gesture ref in sync with zoom state (for native event handlers).
  useLayoutEffect(() => {
    live.current.scale = scale;
    live.current.tx = translate.x;
    live.current.ty = translate.y;
  }, [scale, translate]);

  // ── Native gesture listeners (wheel/touch/mouse) — avoid React passive touch/wheel ─
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

    const onDblClick = () => {
      applyScale(live.current.scale > MIN_SCALE ? MIN_SCALE : ZOOM_IN_TARGET, true);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (live.current.scale <= MIN_SCALE) return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initTx: live.current.tx,
        initTy: live.current.ty,
      };
      setIsGesturing(true);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const tx = dragRef.current.initTx + (e.clientX - dragRef.current.startX);
      const ty = dragRef.current.initTy + (e.clientY - dragRef.current.startY);
      live.current.tx = tx;
      live.current.ty = ty;
      setTranslate({ x: tx, y: ty });
    };

    const endMouseDrag = () => {
      dragRef.current = null;
      setIsGesturing(false);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('dblclick', onDblClick);
    el.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endMouseDrag);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('dblclick', onDblClick);
      el.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', endMouseDrag);
    };
  }, [applyScale, currentIndex]);

  return { gestureRef, scale, translate, isGesturing, resetZoom };
};
