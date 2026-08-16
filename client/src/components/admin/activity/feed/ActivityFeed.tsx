import InfiniteScrollSentinel from '@/components/admin/shared/InfiniteScrollSentinel';
import ActivityEmptyState from './ActivityEmptyState';
import ActivityFeedSkeleton from './ActivityFeedSkeleton';
import ActivityFilterTabs from './ActivityFilterTabs';
import TimelineRow from '../timeline/TimelineRow';
import type { AdminActivityEventGroup } from '@/types/admin';
import type { AdminActivityEvent, AdminActivityFilter } from '@/types/admin';
import type { RefObject } from 'react';

type ActivityFeedProps = {
  scrollRef: RefObject<HTMLDivElement | null>;
  filter: AdminActivityFilter;
  onFilterChange: (filter: AdminActivityFilter) => void;
  isInitialLoad: boolean;
  eventsError: boolean;
  events: AdminActivityEvent[];
  grouped: AdminActivityEventGroup[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelEnabled: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
};

const ActivityFeed = ({
  scrollRef,
  filter,
  onFilterChange,
  isInitialLoad,
  eventsError,
  events,
  grouped,
  hasNextPage,
  isFetchingNextPage,
  sentinelEnabled,
  onLoadMore,
  onRetry,
}: ActivityFeedProps) => (
  <section className="flex min-h-0 flex-1 flex-col lg:col-span-8">
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="font-display text-xl leading-none tracking-tight text-body">Event stream</h2>
        <p className="mt-1.5 text-sm text-body-300">Latest platform activity</p>
      </div>
      <ActivityFilterTabs filter={filter} onChange={onFilterChange} />
    </div>

    <div
      ref={scrollRef}
      className="relative mt-6 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 scrollbar-hide"
    >
      <div
        className="pointer-events-none absolute right-0 top-8 h-40 w-56 rounded-full bg-blue/8 blur-3xl"
        aria-hidden
      />

      {isInitialLoad ? (
        <ActivityFeedSkeleton />
      ) : eventsError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-sm font-medium text-body">Couldn&apos;t load activity</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-border/50 bg-primary/35 px-4 py-2 text-xs font-semibold text-body-300 hover:text-body"
          >
            Try again
          </button>
        </div>
      ) : events.length === 0 ? (
        <ActivityEmptyState filter={filter} />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-body-300/50">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.events.map((event, i) => (
                  <TimelineRow
                    key={`${event.kind}-${event.data._id}-${i}`}
                    event={event}
                    isLast={i === group.events.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}

          <InfiniteScrollSentinel
            scrollRef={scrollRef}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={onLoadMore}
            enabled={sentinelEnabled}
          />
        </div>
      )}
    </div>
  </section>
);

export default ActivityFeed;
