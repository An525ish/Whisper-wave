import { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TimelineItem } from '@/features/chat/types';

const NEAR_BOTTOM_PX = 120;

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
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const focusRequestRef = useRef<string | null>(null);
  const loadingForFocusRef = useRef(false);

  const virtualizer = useVirtualizer({
    count: timelineItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => (timelineRef.current[index]?.kind === 'day' ? 44 : 88),
    overscan: 8,
    getItemKey: (index) => timelineItems[index]?.key ?? index,
  });
  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

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
      requestAnimationFrame(() => {
        virtualizerRef.current.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
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

  // Scroll listener: near-bottom tracking + load-more on scroll-up
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onScroll = () => {
      updateNearBottom();
      if (root.scrollTop > 80) return;
      if (!hasNextPage || isFetchingNextPage) return;
      const prevHeight = root.scrollHeight;
      const prevTop = root.scrollTop;
      void fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          const el = containerRef.current;
          if (!el) return;
          el.scrollTop = prevTop + (el.scrollHeight - prevHeight);
          updateNearBottom();
        });
      });
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [chatId, fetchNextPage, hasNextPage, isFetchingNextPage, updateNearBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    if (didInitialScrollRef.current || historyMessagesLength === 0) return;
    didInitialScrollRef.current = true;
    scrollToBottom();
  }, [historyMessagesLength, scrollToBottom]);

  // Reset didInitialScrollRef on chat switch
  useEffect(() => {
    didInitialScrollRef.current = false;
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
  }, [chatId]);

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
  };
}
