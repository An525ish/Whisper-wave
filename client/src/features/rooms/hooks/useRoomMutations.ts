import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { track } from '@/shared/lib/analytics';
import { ROUTES } from '@/shared/constants/routes';
import useErrors from '@/shared/hooks/useError';
import { addReminder, createRoom, deleteRoom, removeReminder, reportRoomMessage, requestListing, updateRoom } from '../api/rooms';
import { roomsKeys } from './queryKeys';
import { ROOM_EVENTS } from '../constants';
import type { CreateRoomPayload, RoomContentPayload, RoomReportPayload } from '../types';

/** Report one room message. Failures surface, never crash the thread. */
export function useReportRoomMutation(slug: string) {
  const mutation = useMutation({
    mutationFn: (input: RoomReportPayload) => reportRoomMessage(slug, input),
    onSuccess: (res) => {
      track(ROOM_EVENTS.REPORT, {});
      toast.success(
        res.data.hidden
          ? 'Reported — hidden for everyone pending review.'
          : 'Reported. Thanks for looking out.'
      );
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);
  return mutation;
}

/** Create a user room (members only), then open it. */
export function useCreateRoomMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (payload: CreateRoomPayload) => createRoom(payload),
    onSuccess: (res) => {
      track(ROOM_EVENTS.CREATED, {});
      void queryClient.invalidateQueries({ queryKey: roomsKeys.list });
      void queryClient.invalidateQueries({ queryKey: roomsKeys.mine });
      navigate(ROUTES.room(res.data.room.slug));
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);
  return mutation;
}

/** Host content edit — title, description, rules. */
export function useUpdateRoomMutation(slug: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: RoomContentPayload) => updateRoom(slug, input),
    onSuccess: () => {
      toast.success('Room updated.');
      void queryClient.invalidateQueries({ queryKey: roomsKeys.info(slug) });
      void queryClient.invalidateQueries({ queryKey: roomsKeys.list });
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);
  return mutation;
}

/** Host delete — ends live instances, removes the template. */
export function useDeleteRoomMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (slug: string) => deleteRoom(slug),
    onSuccess: () => {
      toast.success('Room deleted.');
      void queryClient.invalidateQueries({ queryKey: roomsKeys.list });
      void queryClient.invalidateQueries({ queryKey: roomsKeys.mine });
      navigate(ROUTES.rooms);
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);
  return mutation;
}

/** Host asks for lobby listing. Unlisted rooms only. */
export function useRequestListingMutation() {
  const mutation = useMutation({
    mutationFn: (slug: string) => requestListing(slug),
    onSuccess: (res) => {
      toast.success(res.message || 'Listing requested.');
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);
  return mutation;
}

/** Toggle a "remind me when it opens" subscription, optimistically. */
export function useRoomReminderMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ slug, on }: { slug: string; on: boolean }) =>
      on ? addReminder(slug) : removeReminder(slug),
    onMutate: async ({ slug, on }) => {
      await queryClient.cancelQueries({ queryKey: roomsKeys.reminders });
      const previous = queryClient.getQueryData<string[]>(roomsKeys.reminders);
      queryClient.setQueryData<string[]>(roomsKeys.reminders, (old = []) =>
        on ? [...new Set([...old, slug])] : old.filter((s) => s !== slug)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(roomsKeys.reminders, ctx?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomsKeys.reminders });
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);
  return mutation;
}
