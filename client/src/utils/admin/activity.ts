import type { AdminActivityEvent, AdminActivityEventGroup } from '@/types/admin';

/** Compact relative time for activity feed rows (e.g. `5m`, `2h`). */
export const activityRelativeTime = (dateStr: string | undefined): string => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export const activityDayGroupLabel = (ts: number): string => {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86_400_000;
  if (ts >= startToday) return 'Today';
  if (ts >= startYesterday) return 'Yesterday';
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const groupActivityEvents = (events: AdminActivityEvent[]): AdminActivityEventGroup[] => {
  const groups: AdminActivityEventGroup[] = [];
  for (const event of events) {
    const label = activityDayGroupLabel(event.ts);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.events.push(event);
    else groups.push({ label, events: [event] });
  }
  return groups;
};

export const formatPresenceUpdated = (ts: number): string =>
  new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
