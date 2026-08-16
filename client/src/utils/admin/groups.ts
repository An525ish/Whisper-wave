import type { UserFilterOption } from '@/types/admin';

export const formatGroupCreated = (dateStr?: string): string =>
  dateStr
    ? new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

export const groupsDirectorySubtitle = (
  memberFilter: UserFilterOption | null,
  querySearch: string,
): string => {
  if (memberFilter) {
    return `Groups ${memberFilter.name} is a member of${querySearch ? ` · ${querySearch}` : ''}`;
  }
  if (querySearch) {
    return `Search results for “${querySearch}”`;
  }
  return 'All groups on the platform';
};

export const groupsEmptyDescription = (
  memberFilter: UserFilterOption | null,
  querySearch: string,
): string => {
  if (memberFilter) {
    return `${memberFilter.name} is not in any groups`;
  }
  if (querySearch) {
    return 'Try a different group name or member';
  }
  return 'No groups have been created yet';
};

export const groupsMatchesLabel = (
  querySearch: string,
  memberFilter: UserFilterOption | null,
): string => (querySearch || memberFilter ? 'Matches' : 'Loaded');

export const groupsMatchesValue = (
  querySearch: string,
  memberFilter: UserFilterOption | null,
  matchTotal: number,
  loadedCount: number,
): number => (querySearch || memberFilter ? matchTotal : loadedCount);
