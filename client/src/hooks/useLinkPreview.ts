import { useQuery } from '@tanstack/react-query';
import { fetchLinkPreview } from '@/api/linkPreview';

export function useLinkPreviewQuery(url: string | null) {
  return useQuery({
    queryKey: ['linkPreview', url],
    queryFn: () => fetchLinkPreview(url!),
    enabled: Boolean(url),
    staleTime: 5 * 60_000, // 5 min — OG data doesn't change often
    retry: false,
    select: (res) => res.data,
  });
}
