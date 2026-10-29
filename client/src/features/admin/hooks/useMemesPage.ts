import { useState } from 'react';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useBlockMemeMutation, useMemeBlocklistQuery, useUnblockMemeMutation } from './useAdminMemes';

export function useMemesPage() {
  const { data, isLoading, isError, refetch } = useMemeBlocklistQuery();
  const [block, { isLoading: blocking }] = useAsyncMutation(useBlockMemeMutation);
  const [unblock] = useAsyncMutation(useUnblockMemeMutation);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  const items = data?.items ?? [];

  /** Resolves true once the id is blocked so the form can reset. */
  const blockId = async (id: number) => (await block('Blocking…', id)) !== null;

  const unblockId = async (id: number) => {
    setUnblockingId(id);
    try {
      await unblock('Unblocking…', id);
    } finally {
      setUnblockingId(null);
    }
  };

  return {
    items,
    blockedCount: data?.ids.length ?? 0,
    reportedCount: items.filter((i) => !i.blocked).length,
    isLoading,
    isError,
    refetch,
    blocking,
    unblockingId,
    blockId,
    unblockId,
  };
}
