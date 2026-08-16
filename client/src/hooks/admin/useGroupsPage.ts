import { useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN_MIN_SEARCH_LEN } from '@/constants/admin/groups';
import { SEARCH_DEBOUNCE_MS } from '@/constants/app';
import { useAdminGroupsQuery, useAdminStatsQuery } from '@/hooks/admin';
import type { AdminGroupRow, UserFilterOption } from '@/types/admin';
import { sumSeries } from '@/utils/admin/dashboard';

export function useGroupsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<UserFilterOption | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AdminGroupRow | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const querySearch =
    debouncedSearch.length >= ADMIN_MIN_SEARCH_LEN ? debouncedSearch : '';

  const { data: statsData } = useAdminStatsQuery();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useAdminGroupsQuery(querySearch, memberFilter?._id ?? '');

  const groups = useMemo(
    () => data?.pages.flatMap((page) => page.groups) ?? [],
    [data],
  );

  const matchTotal = data?.pages[0]?.total ?? 0;
  const platformTotal = statsData?.stats?.groups ?? matchTotal;
  const newThisWeek = useMemo(
    () => sumSeries(statsData?.stats?.groupsSeries ?? []),
    [statsData],
  );
  const totalMembers = useMemo(
    () => groups.reduce((sum, group) => sum + (group.members?.length ?? 0), 0),
    [groups],
  );

  const isSearchPending =
    searchText.trim() !== debouncedSearch ||
    (searchText.trim().length >= ADMIN_MIN_SEARCH_LEN &&
      searchText.trim() !== querySearch);
  const showMinSearchHint =
    searchText.trim().length > 0 && searchText.trim().length < ADMIN_MIN_SEARCH_LEN;

  const sentinelEnabled =
    !isLoading && !isSearchPending && !isError && groups.length > 0;

  return {
    scrollRef,
    searchText,
    setSearchText,
    querySearch,
    memberFilter,
    setMemberFilter,
    selectedGroup,
    setSelectedGroup,
    groups,
    matchTotal,
    platformTotal,
    newThisWeek,
    totalMembers,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
    isSearchPending,
    showMinSearchHint,
    sentinelEnabled,
  };
}
