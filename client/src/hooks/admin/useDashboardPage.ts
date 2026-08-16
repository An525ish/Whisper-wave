import { useMemo } from 'react';
import { useAdminStatsQuery } from '@/hooks/admin';
import type { AdminStats } from '@/types';
import type { DashboardMetric } from '@/types/admin';
import {
  buildCompositionSegments,
  formatDashboardUpdated,
  onlinePercent,
  pendingRequestsHint,
  sumSeries,
  weekHint,
} from '@/utils/admin/dashboard';

export function useDashboardPage() {
  const { data, dataUpdatedAt } = useAdminStatsQuery();
  const stats: AdminStats | undefined = data?.stats;

  const seriesLabels = stats?.seriesLabels ?? [];
  const newUsersSeries = stats?.newUsersSeries ?? [];
  const messagesSeries = stats?.messagesSeries ?? [];
  const groupsSeries = stats?.groupsSeries ?? [];
  const requestsSeries = stats?.requestsSeries ?? [];

  const weekUsers = sumSeries(newUsersSeries);
  const weekMessages = sumSeries(messagesSeries);
  const weekGroups = sumSeries(groupsSeries);
  const weekRequests = sumSeries(requestsSeries);
  const totalUsers = stats?.users ?? 0;
  const onlineUsers = stats?.onlineUsers ?? 0;
  const onlinePct = onlinePercent(onlineUsers, totalUsers);

  const metrics = useMemo<DashboardMetric[]>(
    () => [
      {
        key: 'users',
        label: 'Total users',
        value: stats?.users?.toLocaleString() ?? '—',
        accent: 'text-blue',
        hint: weekHint(weekUsers, 'signups'),
      },
      {
        key: 'groups',
        label: 'Groups',
        value: stats?.groups?.toLocaleString() ?? '—',
        accent: 'text-gold',
        hint: weekHint(weekGroups, 'new groups'),
      },
      {
        key: 'online',
        label: 'Online now',
        value: stats?.onlineUsers?.toLocaleString() ?? '—',
        accent: 'text-green',
        hint: `${onlinePct}% of all users`,
      },
      {
        key: 'messages',
        label: 'Messages',
        value: stats?.messages?.toLocaleString() ?? '—',
        accent: 'text-[#ff7b85]',
        hint: weekHint(weekMessages, 'sent'),
      },
      {
        key: 'pending',
        label: 'Pending',
        value: stats?.pendingRequests?.toLocaleString() ?? '—',
        accent: 'text-yellow',
        hint: pendingRequestsHint(stats?.pendingRequests ?? 0, weekRequests),
      },
    ],
    [stats, weekUsers, weekGroups, onlinePct, weekMessages, weekRequests],
  );

  const composition = useMemo(() => buildCompositionSegments(stats), [stats]);
  const lastUpdated = formatDashboardUpdated(dataUpdatedAt);

  return {
    metrics,
    seriesLabels,
    newUsersSeries,
    messagesSeries,
    groupsSeries,
    requestsSeries,
    weekUsers,
    weekMessages,
    composition,
    lastUpdated,
    onlineUsers,
    totalUsers,
  };
}
