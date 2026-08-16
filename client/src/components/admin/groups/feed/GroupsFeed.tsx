import type { RefObject } from 'react';
import InfiniteScrollSentinel from '@/components/admin/shared/InfiniteScrollSentinel';
import type { AdminGroupRow } from '@/types/admin';
import GroupRow from './GroupRow';
import GroupsEmptyState from './GroupsEmptyState';
import GroupsErrorState from './GroupsErrorState';
import GroupsFeedSkeleton from './GroupsFeedSkeleton';

type GroupsFeedProps = {
  scrollRef: RefObject<HTMLDivElement | null>;
  groups: AdminGroupRow[];
  isLoading: boolean;
  isSearchPending: boolean;
  isError: boolean;
  emptyDescription: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelEnabled: boolean;
  onOpenGroup: (group: AdminGroupRow) => void;
  onLoadMore: () => void;
  onRetry: () => void;
};

const GroupsFeed = ({
  scrollRef,
  groups,
  isLoading,
  isSearchPending,
  isError,
  emptyDescription,
  hasNextPage,
  isFetchingNextPage,
  sentinelEnabled,
  onOpenGroup,
  onLoadMore,
  onRetry,
}: GroupsFeedProps) => (
  <div
    ref={scrollRef}
    className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 scrollbar-hide"
  >
    {isLoading || isSearchPending ? (
      <GroupsFeedSkeleton />
    ) : isError ? (
      <GroupsErrorState onRetry={onRetry} />
    ) : groups.length === 0 ? (
      <GroupsEmptyState description={emptyDescription} />
    ) : (
      <div className="space-y-0.5">
        {groups.map((group) => (
          <GroupRow key={group._id} group={group} onOpen={() => onOpenGroup(group)} />
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
);

export default GroupsFeed;
