import { useEffect, useRef, type RefObject } from 'react';

type Props = {
  scrollRef: RefObject<HTMLElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  enabled?: boolean;
};

/** Observes a sentinel inside a scroll container and loads the next page when it enters view. */
const InfiniteScrollSentinel = ({
  scrollRef,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  enabled = true,
}: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !hasNextPage || isFetchingNextPage) return;

    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root, rootMargin: '160px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, hasNextPage, isFetchingNextPage, onLoadMore, scrollRef]);

  if (!hasNextPage && !isFetchingNextPage) return null;

  return (
    <div ref={sentinelRef} className="flex min-h-10 items-center justify-center py-3">
      {isFetchingNextPage ? (
        <span className="text-xs font-medium text-body-300/55">Loading more…</span>
      ) : null}
    </div>
  );
};

export default InfiniteScrollSentinel;
