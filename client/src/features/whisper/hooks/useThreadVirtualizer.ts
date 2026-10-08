import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { NEAR_BOTTOM_PX } from '../constants';
import type { AnonMessage, ThreadRow } from '../types';

const LEAD_ROW_PX = 56;
const EMPTY_ROW_PX = 260;
const MESSAGE_ROW_PX = 64;
const TYPING_ROW_PX = 40;

interface Params {
  scrollRef: RefObject<HTMLElement | null>;
  messages: AnonMessage[];
  partnerTyping: boolean;
}

/**
 * Virtualizes the thread (same `@tanstack/react-virtual` pattern as the logged-in
 * chat) and owns its scroll behaviour.
 *
 * Rows are: the lead banner, then the messages (or the empty state), then the
 * typing indicator. New content pins the view to the bottom ONLY if the reader was
 * already near it, or if the new message is their own — someone scrolled up
 * re-reading must not be yanked down by an incoming message.
 */
export function useThreadVirtualizer({ scrollRef, messages, partnerTyping }: Params) {
  const empty = messages.length === 0;
  const rowCount = 1 + (empty ? 1 : messages.length) + (partnerTyping ? 1 : 0);

  const rowAt = useCallback(
    (index: number): ThreadRow => {
      if (index === 0) return { kind: 'lead' };
      if (empty) return { kind: 'empty' };
      if (index <= messages.length) return { kind: 'message', index: index - 1 };
      return { kind: 'typing' };
    },
    [empty, messages.length]
  );

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rowAt(index);
      if (row.kind === 'lead') return LEAD_ROW_PX;
      if (row.kind === 'empty') return EMPTY_ROW_PX;
      return row.kind === 'typing' ? TYPING_ROW_PX : MESSAGE_ROW_PX;
    },
    overscan: 8,
    getItemKey: (index) => {
      const row = rowAt(index);
      return row.kind === 'message' ? messages[row.index].id : row.kind;
    },
  });

  const calm = useMediaQuery('(prefers-reduced-motion: reduce)');
  const nearBottomRef = useRef(true);
  const lastIdRef = useRef<string | undefined>(undefined);
  const lastId = messages[messages.length - 1]?.id;
  const lastFrom = messages[messages.length - 1]?.from;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef]);

  useEffect(() => {
    const newOwnMessage = lastId !== lastIdRef.current && lastFrom === 'me';
    lastIdRef.current = lastId;
    if (!nearBottomRef.current && !newOwnMessage) return;
    const frame = requestAnimationFrame(() =>
      virtualizer.scrollToIndex(rowCount - 1, {
        align: 'end',
        behavior: calm ? 'auto' : 'smooth',
      })
    );
    return () => cancelAnimationFrame(frame);
  }, [rowCount, lastId, lastFrom, calm, virtualizer]);

  return { virtualizer, rowAt };
}
