import { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TimelineItem } from '@/types/chat';

const NEAR_BOTTOM_PX = 120;
const STICKY_TOP_PX = 10;
const DAY_ROW_ESTIMATE_PX = 44;
const MESSAGE_ROW_ESTIMATE_PX = 120;
const SCROLL_IDLE_MS = 700;

export type StickyDayHeader = {
  label: string;
  dayIndex: number;
  pushY: number;
};

interface Params {
  chatId: string | undefined;
  timelineItems: TimelineItem[];
  timelineRef: React.MutableRefObject<TimelineItem[]>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  focusMessageId: string | null | undefined;
  searchOpen: boolean;
  liveMessagesLength: number;
  historyMessagesLength: number;
}

export function useChatScroll({
  chatId,
  timelineItems,
  timelineRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  focusMessageId,
  searchOpen,
  liveMessagesLength,
  historyMessagesLength,
}: Params) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [stickyDayHeader, setStickyDayHeader] = useState<StickyDayHeader | null>(null);
  const [isDateHeaderScrolling, setIsDateHeaderScrolling] = useState(false);
  const focusRequestRef = useRef<string | null>(null);
  const loadingForFocusRef = useRef(false);
  const jumpScrollActiveRef = useRef(false);

  const virtualizer = useVirtualizer({
    count: timelineItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) =>
      timelineRef.current[index]?.kind === 'day' ? DAY_ROW_ESTIMATE_PX : MESSAGE_ROW_ESTIMATE_PX,
    overscan: 8,
    getItemKey: (index) => timelineItems[index]?.key ?? index,
  });
  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  const getItemMetrics = useCallback((index: number) => {
    const measured = virtualizerRef.current.measurementsCache[index];
    if (measured) return { start: measured.start, size: measured.size };

    let start = 0;
    const items = timelineRef.current;
    for (let i = 0; i < index; i++) {
      const row = items[i];
      const rowMeasured = virtualizerRef.current.measurementsCache[i];
      start += rowMeasured?.size ?? (row?.kind === 'day' ? DAY_ROW_ESTIMATE_PX : MESSAGE_ROW_ESTIMATE_PX);
    }
    const row = items[index];
    const size = row?.kind === 'day' ? DAY_ROW_ESTIMATE_PX : MESSAGE_ROW_ESTIMATE_PX;
    return { start, size };
  }, [timelineRef]);

  // Remeasure when the timeline changes so row positions stay correct.
  useEffect(() => {
    virtualizerRef.current.measure();
  }, [chatId]);

  const markScrolling = useCallback(() => {
    setIsDateHeaderScrolling(true);
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    scrollIdleTimerRef.current = setTimeout(() => {
      setIsDateHeaderScrolling(false);
      scrollIdleTimerRef.current = null;
    }, SCROLL_IDLE_MS);
  }, []);

  const updateStickyDate = useCallback(() => {
    const root = containerRef.current;
    if (!root) {
      setStickyDayHeader(null);
      return;
    }

    const anchorY = root.scrollTop + STICKY_TOP_PX;
    const items = timelineRef.current;

    let activeDay: { index: number; label: string; start: number; size: number } | null = null;
    let nextDayStart: number | null = null;

    for (let i = 0; i < items.length; i++) {
      const entry = items[i];
      if (entry?.kind !== 'day') continue;

      const { start, size } = getItemMetrics(i);
      if (start <= anchorY) {
        activeDay = { index: i, label: entry.label, start, size };
        nextDayStart = null;
        continue;
      }
      if (activeDay) {
        nextDayStart = start;
        break;
      }
    }

    if (!activeDay || activeDay.start >= anchorY) {
      setStickyDayHeader(null);
      return;
    }

    let pushY = 0;
    if (nextDayStart !== null) {
      const overlap = activeDay.size - (nextDayStart - anchorY);
      if (overlap > 0) pushY = -overlap;
    }

    setStickyDayHeader({
      label: activeDay.label,
      dayIndex: activeDay.index,
      pushY,
    });
  }, [getItemMetrics, timelineRef]);

  const scrollToBottom = useCallback((smooth = false) => {
    const count = timelineRef.current.length;
    if (count === 0) return;
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
    requestAnimationFrame(() => {
      virtualizerRef.current.scrollToIndex(count - 1, {
        align: 'end',
        behavior: smooth ? 'smooth' : 'auto',
      });
    });
  }, [timelineRef]);

  const updateNearBottom = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const distance = root.scrollHeight - root.scrollTop - root.clientHeight;
    const near = distance <= NEAR_BOTTOM_PX;
    isNearBottomRef.current = near;
    setShowScrollToBottom(!near && timelineRef.current.length > 0);
  }, [timelineRef]);

  // Update focusRequestRef when focusMessageId changes
  useEffect(() => {
    if (!focusMessageId) {
      focusRequestRef.current = null;
      return;
    }
    focusRequestRef.current = focusMessageId;
  }, [focusMessageId]);

  // Scroll to focused message
  useEffect(() => {
    const targetId = focusRequestRef.current;
    if (!targetId) return;

    const index = timelineItems.findIndex(
      (item) => item.kind === 'message' && item.message._id === targetId,
    );

    if (index >= 0) {
      loadingForFocusRef.current = false;
      jumpScrollActiveRef.current = true;
      requestAnimationFrame(() => {
        virtualizerRef.current.scrollToIndex(index, { align: 'center', behavior: 'auto' });
        // Clear the jump guard after the frame so the scroll handler doesn't
        // fire fetchNextPage while the virtualizer is still settling.
        requestAnimationFrame(() => {
          jumpScrollActiveRef.current = false;
        });
      });
      setHighlightedMessageId(targetId);
      const clearHighlight = setTimeout(() => {
        setHighlightedMessageId((prev) => (prev === targetId ? null : prev));
      }, 1750);
      return () => clearTimeout(clearHighlight);
    }

    if (!hasNextPage || isFetchingNextPage || loadingForFocusRef.current) return;

    loadingForFocusRef.current = true;
    void fetchNextPage().finally(() => { loadingForFocusRef.current = false; });
  }, [focusMessageId, timelineItems, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Scroll listener: near-bottom tracking + load-more on scroll-up + sticky date
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onScroll = () => {
      markScrolling();
      updateNearBottom();
      updateStickyDate();
      if (root.scrollTop > 80) return;
      if (jumpScrollActiveRef.current) return;
      if (!hasNextPage || isFetchingNextPage) return;
      const prevHeight = root.scrollHeight;
      const prevTop = root.scrollTop;
      void fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          const el = containerRef.current;
          if (!el) return;
          el.scrollTop = prevTop + (el.scrollHeight - prevHeight);
          updateNearBottom();
          updateStickyDate();
        });
      });
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [chatId, fetchNextPage, hasNextPage, isFetchingNextPage, markScrolling, updateNearBottom, updateStickyDate]);

  // Initial scroll to bottom
  useEffect(() => {
    if (didInitialScrollRef.current || historyMessagesLength === 0) return;
    didInitialScrollRef.current = true;
    scrollToBottom();
  }, [historyMessagesLength, scrollToBottom]);

  // Reset state on chat switch
  useEffect(() => {
    didInitialScrollRef.current = false;
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
    setStickyDayHeader(null);
    setIsDateHeaderScrolling(false);
    if (scrollIdleTimerRef.current) {
      clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = null;
    }
  }, [chatId]);

  useEffect(() => () => {
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
  }, []);

  // Scroll to bottom on new live messages
  useEffect(() => {
    if (liveMessagesLength === 0) return;
    if (searchOpen || focusMessageId) return;
    if (!isNearBottomRef.current) {
      setShowScrollToBottom(true);
      return;
    }
    scrollToBottom();
  }, [liveMessagesLength, scrollToBottom, searchOpen, focusMessageId]);

  return {
    containerRef,
    virtualizer,
    isNearBottomRef,
    showScrollToBottom,
    setShowScrollToBottom,
    scrollToBottom,
    updateNearBottom,
    highlightedMessageId,
    stickyDayHeader,
    isDateHeaderScrolling,
  };
}
