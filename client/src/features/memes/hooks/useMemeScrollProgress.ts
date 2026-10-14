import { useCallback, useRef } from 'react';

/**
 * Scroll hairline + header shadow for the feed panel. Writes straight to the
 * DOM (a transform and a class) so scrolling never re-renders React.
 */
export function useMemeScrollProgress() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const progress = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
    if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    topRef.current?.classList.toggle('mm-top--scrolled', el.scrollTop > 8);
  }, []);

  return { scrollRef, topRef, barRef, onScroll };
}
