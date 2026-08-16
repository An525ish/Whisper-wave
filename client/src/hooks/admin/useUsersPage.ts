import { useEffect, useMemo, useRef, useState } from 'react';
import { ADMIN_MIN_SEARCH_LEN } from '@/constants/admin/users';
import { SEARCH_DEBOUNCE_MS } from '@/constants/app';
import { useAdminStatsQuery, useAdminUsersQuery } from '@/hooks/admin';
import { sumSeries } from '@/utils/admin/dashboard';

export function useUsersPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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
  } = useAdminUsersQuery(querySearch);

  const users = useMemo(
    () => data?.pages.flatMap((page) => page.users) ?? [],
    [data],
  );

  const matchTotal = data?.pages[0]?.total ?? 0;
  const platformTotal = statsData?.stats?.users ?? matchTotal;
  const newThisWeek = useMemo(
    () => sumSeries(statsData?.stats?.newUsersSeries ?? []),
    [statsData],
  );

  const isSearchPending =
    searchText.trim() !== debouncedSearch ||
    (searchText.trim().length >= ADMIN_MIN_SEARCH_LEN &&
      searchText.trim() !== querySearch);
  const showMinSearchHint =
    searchText.trim().length > 0 && searchText.trim().length < ADMIN_MIN_SEARCH_LEN;

  const sentinelEnabled =
    !isLoading && !isSearchPending && !isError && users.length > 0;

  return {
    scrollRef,
    searchText,
    setSearchText,
    querySearch,
    selectedUserId,
    setSelectedUserId,
    users,
    matchTotal,
    platformTotal,
    newThisWeek,
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
