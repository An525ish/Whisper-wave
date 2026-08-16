import ActivityFeed from './feed/ActivityFeed';
import ActivityHeader from './header/ActivityHeader';
import ActivityStats from './stats/ActivityStats';
import OnlinePanel from './presence/OnlinePanel';
import { useActivityPage } from '@/hooks/admin';

const Activity = () => {
  const {
    scrollRef,
    filter,
    setFilter,
    presenceUpdatedAt,
    onlineUsers,
    onlineCount,
    extraOnline,
    platformUsers,
    platformMessages,
    events,
    grouped,
    refreshFeed,
    isInitialLoad,
    eventsError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchEvents,
    isRefetching,
    sentinelEnabled,
  } = useActivityPage();

  return (
    <div className="mx-auto flex h-[calc(100dvh-3rem)] max-h-[calc(100dvh-3rem)] min-h-0 w-full max-w-6xl flex-col gap-8 lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)]">
      <ActivityHeader
        presenceUpdatedAt={presenceUpdatedAt}
        isRefetching={isRefetching}
        onRefresh={refreshFeed}
      />

      <ActivityStats
        onlineCount={onlineCount}
        platformUsers={platformUsers}
        platformMessages={platformMessages}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-8 lg:grid lg:grid-cols-12 lg:gap-12">
        <aside className="shrink-0 lg:col-span-4 lg:min-h-0 lg:border-r lg:border-border/35 lg:pr-10">
          <OnlinePanel users={onlineUsers} count={onlineCount} extra={extraOnline} />
        </aside>

        <ActivityFeed
          scrollRef={scrollRef}
          filter={filter}
          onFilterChange={setFilter}
          isInitialLoad={isInitialLoad}
          eventsError={eventsError}
          events={events}
          grouped={grouped}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          sentinelEnabled={sentinelEnabled}
          onLoadMore={() => void fetchNextPage()}
          onRetry={() => void refetchEvents()}
        />
      </div>
    </div>
  );
};

export default Activity;
