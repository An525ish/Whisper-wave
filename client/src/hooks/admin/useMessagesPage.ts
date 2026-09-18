import { useMemo, useRef, useState } from 'react';
import { ADMIN_MIN_SEARCH_LEN } from '@/constants/admin/messages';
import { SEARCH_DEBOUNCE_MS } from '@/constants/app';
import { useDebounce } from '@/hooks/shared/useDebounce';
import {
  useAdminMessagesQuery,
  useAdminStatsQuery,
  useDeleteAdminMessageMutation,
  useRetryAdminMessageMutation,
} from '@/hooks/admin';
import type { AdminMessageRow, AdminMessageStatusFilter, UserFilterOption } from '@/types/admin';
import { sumSeries } from '@/utils/admin/dashboard';

export function useMessagesPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminMessageStatusFilter>('all');
  const [senderFilter, setSenderFilter] = useState<UserFilterOption | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminMessageRow | null>(null);

  const debouncedSearch = useDebounce(searchText.trim(), SEARCH_DEBOUNCE_MS);

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
  } = useAdminMessagesQuery(statusFilter, querySearch, senderFilter?._id ?? '');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { mutate: _deleteMessage } = useDeleteAdminMessageMutation();
  const { mutate: _retryMessage } = useRetryAdminMessageMutation();

  const deleteMessage = (id: string) => {
    setDeletingId(id);
    _deleteMessage(id, { onSettled: () => setDeletingId(null) });
  };
  const retryMessage = (id: string) => {
    setRetryingId(id);
    _retryMessage(id, { onSettled: () => setRetryingId(null) });
  };

  const messages = useMemo(
    () => data?.pages.flatMap((page) => page.messages) ?? [],
    [data],
  );

  const matchTotal = data?.pages[0]?.total ?? 0;
  const platformTotal = statsData?.stats?.messages ?? matchTotal;
  const newThisWeek = useMemo(
    () => sumSeries(statsData?.stats?.messagesSeries ?? []),
    [statsData],
  );
  const failedLoaded = useMemo(
    () => messages.filter((msg) => msg.status === 'failed').length,
    [messages],
  );

  const isSearchPending =
    searchText.trim() !== debouncedSearch ||
    (searchText.trim().length >= ADMIN_MIN_SEARCH_LEN &&
      searchText.trim() !== querySearch);
  const showMinSearchHint =
    searchText.trim().length > 0 && searchText.trim().length < ADMIN_MIN_SEARCH_LEN;

  const sentinelEnabled =
    !isLoading && !isSearchPending && !isError && messages.length > 0;

  return {
    scrollRef,
    searchText,
    setSearchText,
    querySearch,
    statusFilter,
    setStatusFilter,
    senderFilter,
    setSenderFilter,
    deleteTarget,
    setDeleteTarget,
    messages,
    matchTotal,
    platformTotal,
    newThisWeek,
    failedLoaded,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
    isSearchPending,
    showMinSearchHint,
    sentinelEnabled,
    deleteMessage,
    retryMessage,
    deletingId,
    retryingId,
  };
}
