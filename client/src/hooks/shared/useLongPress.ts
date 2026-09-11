import { useCallback, useRef, type TouchEvent } from 'react';

type LongPressPoint = { clientX: number; clientY: number };

type UseLongPressOptions = {
  delay?: number;
};

/**
 * Touch long-press that cancels on finger move (scroll). Returns a binder per item.
 */
export function useLongPress<T>(
  onLongPress: (data: T, point: LongPressPoint) => void,
  { delay = 500 }: UseLongPressOptions = {},
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const bind = useCallback(
    (data: T) => ({
      onTouchStart: (e: TouchEvent<HTMLElement>) => {
        const touch = e.touches[0];
        if (!touch) return;
        movedRef.current = false;
        const { clientX, clientY } = touch;
        clearTimer();
        timerRef.current = setTimeout(() => {
          if (!movedRef.current) onLongPress(data, { clientX, clientY });
        }, delay);
      },
      onTouchEnd: clearTimer,
      onTouchMove: () => {
        movedRef.current = true;
        clearTimer();
      },
      onTouchCancel: clearTimer,
      onSelectStart: (e: Event) => { e.preventDefault(); },
      style: { WebkitUserSelect: 'none' as const, userSelect: 'none' as const },
    }),
    [clearTimer, delay, onLongPress],
  );

  return bind;
}
