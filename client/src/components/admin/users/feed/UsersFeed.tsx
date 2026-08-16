import type { RefObject } from 'react';
import InfiniteScrollSentinel from '@/components/admin/shared/InfiniteScrollSentinel';
import type { AdminUserRow } from '@/types/admin';
import UserRow from './UserRow';
import UsersEmptyState from './UsersEmptyState';
import UsersErrorState from './UsersErrorState';
import UsersFeedSkeleton from './UsersFeedSkeleton';

type UsersFeedProps = {
  scrollRef: RefObject<HTMLDivElement | null>;
  users: AdminUserRow[];
  isLoading: boolean;
  isSearchPending: boolean;
  isError: boolean;
  emptyDescription: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelEnabled: boolean;
  onOpenUser: (userId: string) => void;
  onLoadMore: () => void;
  onRetry: () => void;
};

const UsersFeed = ({
  scrollRef,
  users,
  isLoading,
  isSearchPending,
  isError,
  emptyDescription,
  hasNextPage,
  isFetchingNextPage,
  sentinelEnabled,
  onOpenUser,
  onLoadMore,
  onRetry,
}: UsersFeedProps) => (
  <div
    ref={scrollRef}
    className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 scrollbar-hide"
  >
    {isLoading || isSearchPending ? (
      <UsersFeedSkeleton />
    ) : isError ? (
      <UsersErrorState onRetry={onRetry} />
    ) : users.length === 0 ? (
      <UsersEmptyState description={emptyDescription} />
    ) : (
      <div className="space-y-0.5">
        {users.map((user) => (
          <UserRow
            key={user._id}
            user={user}
            onOpen={() => onOpenUser(String(user._id))}
          />
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

export default UsersFeed;
