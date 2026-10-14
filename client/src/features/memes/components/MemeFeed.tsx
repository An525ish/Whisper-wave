import { useRef } from 'react';
import { useMemeFeed } from '../hooks/useMemeFeed';
import { useMemeScrollProgress } from '../hooks/useMemeScrollProgress';
import { useMemeVirtualList } from '../hooks/useMemeVirtualList';
import MemeCard from './MemeCard';
import MemeFeedBackdrop from './MemeFeedBackdrop';
import MemeFeedHeader from './MemeFeedHeader';
import MemeFeedHero from './MemeFeedHero';
import MemeFindSomeone from './MemeFindSomeone';
import MemeSkeleton from './MemeSkeleton';
import './memesBackdrop.css';
import './memesHeader.css';
import './memesList.css';
import './memesStates.css';

/**
 * The joke tap as a fixed viewport: a sticky glass header (shelf chips, the
 * 18+ switch) on top, one virtualized jokes scroll below. The page itself
 * never scrolls — the feed panel does, with a progress hairline under the
 * header. Hidden jokes never render; the last page ends the scroller.
 */
const MemeFeed = () => {
  const feed = useMemeFeed();
  const { scrollRef, topRef, barRef, onScroll } = useMemeScrollProgress();
  const listRef = useRef<HTMLDivElement>(null);
  const { virtualizer, scrollMargin } = useMemeVirtualList({
    scrollRef,
    listRef,
    rows: feed.rows,
    hasNextPage: feed.hasNextPage,
    isFetchingNextPage: feed.isFetchingNextPage,
    fetchNextPage: feed.fetchNextPage,
  });

  return (
    <div className="mm-page">
      <MemeFeedBackdrop />

      <div className="mm-viewport">
        <MemeFeedHeader
          unfiltered={feed.unfiltered}
          chips={feed.chips}
          category={feed.category}
          onSelect={feed.selectCategory}
          topRef={topRef}
          barRef={barRef}
        />

        <div ref={scrollRef} onScroll={onScroll} className="mm-feedscroll">
          <MemeFeedHero unfiltered={feed.unfiltered} />

          {feed.isLoading && (
            <div aria-label="Loading memes" className="mm-list">
              <MemeSkeleton />
              <MemeSkeleton />
            </div>
          )}

          {feed.isError && (
            <div className="mm-error">
              <p className="mm-error__title">The joke tap is dry.</p>
              <p className="mm-error__sub">Give it a moment, then try again.</p>
              <button type="button" onClick={feed.retry} className="mm-error__btn">
                Try again
              </button>
            </div>
          )}

          <div
            ref={listRef}
            className="mm-vlist"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = feed.rows[virtualRow.index];
              return (
                <div
                  key={row.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="mm-vrow"
                  style={{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
                >
                  {row.kind === 'meme' ? (
                    <MemeCard item={row.item} index={row.index} />
                  ) : (
                    <MemeFindSomeone />
                  )}
                </div>
              );
            })}
          </div>

          {feed.isFetchingNextPage && (
            <div aria-label="Loading more" className="mm-list">
              <MemeSkeleton />
            </div>
          )}
          {!feed.hasNextPage && !feed.isLoading && feed.rows.length > 0 && (
            <p className="mm-end">That&apos;s the whole tap — for now</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemeFeed;
