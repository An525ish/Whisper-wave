import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/hooks/admin/queryKeys';
import {
  useAdminActivityEventsQuery,
  useAdminActivityPresenceQuery,
  useAdminImpersonationLogsQuery,
  useAdminStatsQuery,
} from '@/hooks/admin';
import type { AdminActivityFilter } from '@/types/admin';
import { groupActivityEvents } from '@/utils/admin/activity';

export function useActivityPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AdminActivityFilter>('all');

  const isAdminLogsTab = filter === 'admin-logs';

  const {
    data: presence,
    dataUpdatedAt: presenceUpdatedAt,
    isLoading: presenceLoading,
  } = useAdminActivityPresenceQuery();

  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchEvents,
    isRefetching,
  } = useAdminActivityEventsQuery(filter, !isAdminLogsTab);

  const {
    data: logsData,
    isLoading: logsLoading,
    isError: logsError,
    isFetchingNextPage: logsFetchingNextPage,
    hasNextPage: logsHasNextPage,
    fetchNextPage: logsFetchNextPage,
  } = useAdminImpersonationLogsQuery(isAdminLogsTab);

  const { data: statsData } = useAdminStatsQuery();

  const onlineUsers = presence?.onlineUsers ?? [];
  const onlineCount = presence?.onlineCount ?? 0;
  const extraOnline = Math.max(0, onlineCount - onlineUsers.length);
  const platformUsers = statsData?.stats?.users ?? 0;
  const platformMessages = statsData?.stats?.messages ?? 0;

  const events = useMemo(
    () => eventsData?.pages.flatMap((page) => page.events) ?? [],
    [eventsData],
  );

  const grouped = useMemo(() => groupActivityEvents(events), [events]);

  const impersonationLogs = useMemo(
    () => logsData?.pages.flatMap((page) => page.logs) ?? [],
    [logsData],
  );

  const refreshFeed = () => {
    void refetchEvents();
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.activityPresence });
    void queryClient.invalidateQueries({ queryKey: ['adminImpersonationLogs'] });
  };

  const isInitialLoad = presenceLoading || (isAdminLogsTab ? logsLoading : eventsLoading);
  const sentinelEnabled = !isInitialLoad && !eventsError && events.length > 0;
  const logsSentinelEnabled = !isInitialLoad && !logsError && impersonationLogs.length > 0;

  return {
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
  };
}
