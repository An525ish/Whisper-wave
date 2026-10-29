import { useMemo, useRef } from 'react';
import { useAdminReportsQuery } from './useAdminReports';
import { useReportActions } from './useReportActions';

export function useReportsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useAdminReportsQuery();
  const actions = useReportActions();

  const reports = useMemo(() => data?.pages.flatMap((page) => page.reports) ?? [], [data]);
  const total = data?.pages.at(-1)?.total ?? 0;

  return {
    scrollRef,
    reports,
    total,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    sentinelEnabled: !isLoading && !isError && reports.length > 0,
    ...actions,
  };
}
