import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actOnAdminReport, listAdminReports, reviewAdminReport } from '../api/admin';
import { adminQueryKeys } from './queryKeys';
import type { AdminReportActionInput, AdminReportReviewInput } from '../types';

/** Moderation queue, oldest unreviewed first; pages append as the admin loads more. */
export function useAdminReportsQuery() {
  return useInfiniteQuery({
    queryKey: adminQueryKeys.reports,
    queryFn: ({ pageParam }) => listAdminReports(pageParam).then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: 15_000,
  });
}

/** Resolve a report; the server requires the note ("what was done"). */
export function useReviewReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actionNote }: AdminReportReviewInput) => reviewAdminReport(id, actionNote),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportsPrefix });
    },
  });
}

/** Hide the reported message or ban the offender; does not resolve the report. */
export function useReportActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminReportActionInput) => actOnAdminReport(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportsPrefix });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.roomBans });
    },
  });
}
