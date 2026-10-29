import { useMemo, useState } from 'react';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { formToUpsert, roomToUpsert } from '../utils/rooms';
import { useAdminRoomsQuery, useCloseInstanceMutation, useUpsertRoomMutation } from './useAdminRooms';
import type { AdminRoomFilter, AdminRoomRow, RoomEditForm } from '../types';

export function useRoomsPage() {
  const { data: rooms, isLoading, isError, refetch } = useAdminRoomsQuery();
  const [upsert, { isLoading: saving }] = useAsyncMutation(useUpsertRoomMutation);
  const [close] = useAsyncMutation(useCloseInstanceMutation);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const [filter, setFilter] = useState<AdminRoomFilter>('all');
  const visibleRooms = useMemo(
    () => rooms?.filter((r) => filter === 'all' || r.visibility === filter),
    [rooms, filter],
  );

  const awaitingReview = useMemo(
    () => rooms?.filter((r) => r.visibility === 'unlisted' && r.listingRequestedAt) ?? [],
    [rooms],
  );

  const approve = (room: AdminRoomRow) =>
    upsert('Approving room…', roomToUpsert(room, { visibility: 'public' }));

  const saveRoom = async (slug: string, values: RoomEditForm) => {
    const saved = await upsert('Saving room…', formToUpsert(slug, values));
    if (saved !== null) setEditingSlug(null);
  };

  const closeInstance = async (instanceId: string) => {
    setClosingId(instanceId);
    try {
      await close('Closing instance…', { instanceId });
    } finally {
      setClosingId(null);
    }
  };

  return {
    rooms,
    visibleRooms,
    filter,
    setFilter,
    awaitingReview,
    isLoading,
    isError,
    refetch,
    saving,
    editingSlug,
    setEditingSlug,
    closingId,
    approve,
    saveRoom,
    closeInstance,
  };
}
