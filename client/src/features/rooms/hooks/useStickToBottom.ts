import { useCallback, useEffect, useRef, useState } from 'react';
import { ROOM_STICK_THRESHOLD_PX } from '../constants';

/**
 * Keep a growing thread pinned to its newest message unless the reader scrolled
 * up. Keyed on the LAST message id, not the length (the store caps the list, so
 * the length stops changing once it is full). When new messages land while
 * scrolled up, `showJump` lights the "New messages" pill.
 */
export function useStickToBottom(lastId: string | undefined) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [seenId, setSeenId] = useState(lastId);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < ROOM_STICK_THRESHOLD_PX;
    stickRef.current = near;
    setAtBottom(near);
    if (near) setSeenId(lastId);
  }, [lastId]);

  const jumpToLatest = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, []);

  return { listRef, onScroll, jumpToLatest, showJump: !atBottom && lastId !== seenId };
}
