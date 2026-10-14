import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MEME_ROW_ESTIMATE_PX } from '../constants';
import type { MemeFeedRow } from '../types';

/** Start fetching when the reader is this many rows from the end. */
const PREFETCH_ROWS = 4;

interface Params {
  /** The scrolling panel (hero + list live inside it). */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** The list box — its offset inside the panel is the hero's height. */
  listRef: RefObject<HTMLDivElement | null>;
  rows: MemeFeedRow[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
}

/**
 * Virtualizes the joke feed (same `@tanstack/react-virtual` pattern as the
 * chat thread) and drives infinite loading from the virtual window: when the
 * last rendered row is near the end, the next page is requested. The hero
 * above the list scrolls inside the same panel, so its height is the
 * virtualizer's `scrollMargin`, re-measured on resize.
 */
export function useMemeVirtualList({
  scrollRef,
  listRef,
  rows,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Params) {
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const list = listRef.current;
    const panel = scrollRef.current;
    if (!list || !panel) return;
    const measure = () => setScrollMargin(list.offsetTop);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [listRef, scrollRef]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => MEME_ROW_ESTIMATE_PX,
    overscan: 3,
    scrollMargin,
    getItemKey: (index) => rows[index].key,
  });

  const items = virtualizer.getVirtualItems();
  const lastIndex = items.length > 0 ? items[items.length - 1].index : -1;

  useEffect(() => {
    if (lastIndex < 0 || !hasNextPage || isFetchingNextPage) return;
    if (lastIndex >= rows.length - PREFETCH_ROWS) void fetchNextPage();
  }, [lastIndex, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return { virtualizer, items, scrollMargin };
}
