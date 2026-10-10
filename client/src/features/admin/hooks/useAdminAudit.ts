import { useQuery } from '@tanstack/react-query';
import { listModAudit } from '@/features/admin/api/admin';
import { adminQueryKeys } from '@/features/admin/hooks/queryKeys';

/** Moderation audit trail, newest first. Read-only — acts log themselves. */
export function useModAuditQuery() {
  return useQuery({
    queryKey: adminQueryKeys.audit,
    queryFn: () => listModAudit().then((res) => res.data.entries),
    staleTime: 15_000,
  });
}
