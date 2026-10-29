import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { track } from '@/shared/lib/analytics';
import { MEME_CATEGORY_CHIPS, MEME_DARK_CHIP, MEME_EVENTS } from '../constants';
import { useMemeStore } from '../stores/memeStore';
import { buildFeedRows } from '../utils/feedRows';
import { useMemeMode } from './useMemeMode';
import { useMemeSavesQuery } from './useMemeSaves';
import { useMemesInfinite } from './useMemesInfinite';
import type { MemeCategory } from '../types';

/**
 * The feed screen's brain: which shelf is selected, which stream that maps to
 * (the stored unfiltered opt-in picks safe vs raw — never a param), and the
 * rows to render. The Dark chip exists only while the opt-in is on, and a
 * selected Dark shelf falls back to Mix the moment it is switched off.
 */
export function useMemeFeed() {
  const [selected, setSelected] = useState<MemeCategory>('mix');
  const { data: mode } = useMemeMode();
  const unfiltered = mode === true;
  const category: MemeCategory = selected === 'dark' && !unfiltered ? 'mix' : selected;
  const hiddenIds = useMemeStore((s) => s.hidden);
  const trackedRef = useRef(false);

  useMemeSavesQuery();
  const query = useMemesInfinite(category, unfiltered);
  const { data } = query;

  useEffect(() => {
    if (trackedRef.current || !data) return;
    trackedRef.current = true;
    track(MEME_EVENTS.FEED_VIEW, { category });
  }, [data, category]);

  const rows = useMemo(
    () => buildFeedRows(data?.pages.flatMap((page) => page.items) ?? [], new Set(hiddenIds)),
    [data, hiddenIds]
  );

  const chips = useMemo(
    () => (unfiltered ? [...MEME_CATEGORY_CHIPS, MEME_DARK_CHIP] : MEME_CATEGORY_CHIPS),
    [unfiltered]
  );

  const selectCategory = useCallback((next: MemeCategory) => {
    setSelected(next);
    track(MEME_EVENTS.CATEGORY, { category: next });
  }, []);

  return {
    category,
    chips,
    selectCategory,
    unfiltered,
    rows,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    retry: () => {
      void query.refetch();
    },
  };
}
