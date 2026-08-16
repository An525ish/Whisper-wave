import ActivityFeed from './feed/ActivityFeed';
import AdminLogsSection from './feed/AdminLogsSection';
import ActivityHeader from './header/ActivityHeader';
import ActivityStats from './stats/ActivityStats';
import OnlinePanel from './presence/OnlinePanel';
import ActivityFilterTabs from './feed/ActivityFilterTabs';
import { useActivityPage } from '@/hooks/admin';

const Activity = () => {
  const {
    scrollRef,
    filter,
    setFilter,
    isAdminLogsTab,
    presenceUpdatedAt,
    onlineUsers,
    onlineCount,
    extraOnline,
    platformUsers,
    platformMessages,
    events,
    grouped,
    impersonationLogs,
    logsError,
    logsHasNextPage,
    logsFetchingNextPage,
    logsFetchNextPage,
    logsSentinelEnabled,
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

        {isAdminLogsTab ? (
          <section className="flex min-h-0 flex-1 flex-col lg:col-span-8">
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl leading-none tracking-tight text-body">Admin logs</h2>
                <p className="mt-1.5 text-sm text-body-300">All impersonation sessions</p>
              </div>
              <ActivityFilterTabs filter={filter} onChange={setFilter} />
            </div>
            <div className="mt-6 min-h-0 flex-1">
              <AdminLogsSection
                scrollRef={scrollRef}
                logs={impersonationLogs}
                isLoading={isInitialLoad}
                isError={Boolean(logsError)}
                hasNextPage={Boolean(logsHasNextPage)}
                isFetchingNextPage={logsFetchingNextPage}
                sentinelEnabled={logsSentinelEnabled}
                onLoadMore={() => void logsFetchNextPage()}
              />
            </div>
          </section>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Activity;
