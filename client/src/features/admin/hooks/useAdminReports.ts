import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAdminReports, reviewAdminReport } from '@/features/admin/api/admin';
import { adminQueryKeys } from '@/features/admin/hooks/queryKeys';

/** Moderation queue, newest unreviewed first. */
export function useAdminReportsQuery(page = 1) {
  return useQuery({
    queryKey: adminQueryKeys.reports(page),
    queryFn: () => listAdminReports(page).then((res) => res.data),
    staleTime: 15_000,
  });
}

/** Mark reviewed, optionally extending the anon block between the pair. */
export function useReviewReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewed }: { id: string; reviewed: boolean }) =>
      reviewAdminReport(id, reviewed),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportsPrefix });
    },
  });
}
