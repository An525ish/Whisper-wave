import { DASHBOARD_COMPOSITION_GLOWS } from '@/constants/admin/dashboard';
import type { AdminStats } from '@/types';
import type { DashboardCompositionSegment } from '@/types/admin';

export const sumSeries = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

export const weekHint = (count: number, unit: string): string =>
  count > 0 ? `${count} ${unit} this week` : `No ${unit} this week`;

export const onlinePercent = (online: number, total: number): number =>
  total > 0 ? Math.min(100, Math.round((online / total) * 100)) : 0;

export const dmChatCount = (chats = 0, groups = 0): number =>
  Math.max(0, chats - groups);

export const formatDashboardUpdated = (timestamp: number): string | null =>
  timestamp > 0 ? new Date(timestamp).toLocaleTimeString() : null;

export const buildCompositionSegments = (
  stats?: AdminStats,
): DashboardCompositionSegment[] => [
  { label: 'Users', value: stats?.users ?? 0, glow: DASHBOARD_COMPOSITION_GLOWS.users },
  { label: 'Groups', value: stats?.groups ?? 0, glow: DASHBOARD_COMPOSITION_GLOWS.groups },
  {
    label: 'DM chats',
    value: dmChatCount(stats?.chats, stats?.groups),
    glow: DASHBOARD_COMPOSITION_GLOWS.dmChats,
  },
  { label: 'Messages', value: stats?.messages ?? 0, glow: DASHBOARD_COMPOSITION_GLOWS.messages },
];

export const pendingRequestsHint = (
  pending: number,
  weekRequests: number,
): string =>
  weekRequests > 0
    ? `${pending} in queue · ${weekRequests} received this week`
    : `${pending} in queue · no requests this week`;
