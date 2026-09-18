import { useCallback, useRef } from 'react';

type UseDragToCloseOptions = {
  onClose: () => void;
  /** Pixels dragged down before releasing triggers close. Default 80. */
  threshold?: number;
  /** Pixels/ms minimum velocity to trigger close even before threshold. Default 0.4. */
  velocityThreshold?: number;
};

/**
 * Returns refs + handlers to attach to a bottom-sheet container.
 * Dragging down past `threshold` (or fast flick) calls `onClose`.
 *
 * Usage:
 *   const { sheetRef, handleRef, dragStyle, dragHandlers } = useDragToClose({ onClose });
 *   <div ref={sheetRef} style={dragStyle} {...dragHandlers}>
 *     <div ref={handleRef} />   ← drag handle (touch target)
 *   </div>
 *
 * `handleRef` is optional — if attached, only drags starting on the handle
 * trigger the gesture. If omitted, the whole sheet is draggable.
 */
export function useDragToClose({
  onClose,
  threshold = 80,
  velocityThreshold = 0.4,
}: UseDragToCloseOptions) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  // Track gesture state without re-rendering
  const gesture = useRef({
    active: false,
    startY: 0,
    startTime: 0,
    deltaY: 0,
  });

  const setTranslate = useCallback((dy: number) => {
    const el = sheetRef.current;
    if (!el) return;
    // Only allow downward drag
    const clamped = Math.max(0, dy);
    el.style.transform = clamped > 0 ? `translateY(${clamped}px)` : '';
    el.style.transition = clamped > 0 ? 'none' : '';
  }, []);

  const reset = useCallback(() => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transform = '';
    el.style.transition = '';
    el.style.userSelect = '';
    (el.style as CSSStyleDeclaration & { WebkitUserSelect: string }).WebkitUserSelect = '';
    gesture.current.active = false;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // If handleRef is attached, only start when touch begins on the handle
    if (handleRef.current && !handleRef.current.contains(e.target as Node)) return;
    gesture.current = {
      active: true,
      startY: e.touches[0].clientY,
      startTime: Date.now(),
      deltaY: 0,
    };
    // Suppress text selection for the duration of the drag
    const el = sheetRef.current;
    if (el) { el.style.userSelect = 'none'; (el.style as CSSStyleDeclaration & { WebkitUserSelect: string }).WebkitUserSelect = 'none'; }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gesture.current.active) return;
    const dy = e.touches[0].clientY - gesture.current.startY;
    gesture.current.deltaY = dy;
    setTranslate(dy);
    // Prevent page scroll while dragging down
    if (dy > 4) e.preventDefault();
  }, [setTranslate]);

  const onTouchEnd = useCallback(() => {
    if (!gesture.current.active) return;
    const { deltaY, startTime } = gesture.current;
    const elapsed = Math.max(1, Date.now() - startTime);
    const velocity = deltaY / elapsed; // px/ms

    if (deltaY >= threshold || velocity >= velocityThreshold) {
      reset();
      onClose();
    } else {
      reset();
    }
  }, [onClose, threshold, velocityThreshold, reset]);

  const dragHandlers = { onTouchStart, onTouchMove, onTouchEnd };

  return { sheetRef, handleRef, dragHandlers };
}
