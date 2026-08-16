import type { AdminUserRow } from '@/types/admin';

export const formatUserJoined = (dateStr?: string): string =>
  dateStr
    ? new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

export const userRowSubtitle = (user: AdminUserRow): string => {
  const email = user.email?.trim();
  const bio = user.bio?.trim();
  if (email) return email;
  if (bio) return bio;
  return 'No email on file';
};

export const usersDirectorySubtitle = (querySearch: string): string =>
  querySearch ? `Search results for “${querySearch}”` : 'Newest members first';

export const usersEmptyDescription = (querySearch: string): string =>
  querySearch ? 'Try a different name, username, or email' : 'No accounts yet';

export const usersMatchesLabel = (querySearch: string): string =>
  querySearch ? 'Matches' : 'Loaded';

export const usersMatchesValue = (
  querySearch: string,
  matchTotal: number,
  loadedCount: number,
): number => (querySearch ? matchTotal : loadedCount);

export const fieldValue = (value?: string | null): string | null =>
  value?.trim() ? value : null;

export const relativeTime = (dateStr: string | undefined): string => {
  if (!dateStr) return 'Not seen yet';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const presenceMeta = (lastSeen?: string) => {
  if (!lastSeen) {
    return { label: 'No activity yet', dot: 'bg-body-300/40', text: 'text-body-300/60' };
  }
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 5 * 60_000) {
    return { label: 'Active now', dot: 'bg-green', text: 'text-green' };
  }
  if (diff < 24 * 60 * 60_000) {
    return { label: 'Recently active', dot: 'bg-gold', text: 'text-gold' };
  }
  return { label: 'Offline', dot: 'bg-body-300/50', text: 'text-body-300/60' };
};

export const lastActiveAccent = (lastSeen?: string): string => {
  if (!lastSeen) return 'text-body-300/50';
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 5 * 60_000) return 'text-green';
  if (diff < 24 * 60 * 60_000) return 'text-gold';
  return 'text-body';
};
