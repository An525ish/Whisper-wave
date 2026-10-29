import { useAuthStore } from '@/features/auth';
import { usePushNotifications } from '@/features/notifications';
import type { RoomReminderControl, RoomSummary } from '../types';
import { useRoomReminderMutation } from './useRoomMutations';
import { useRoomRemindersQuery } from './useRoomsQueries';

/**
 * Per-room reminder button state for the lobby. Members only, and only while
 * server push is configured and usable here: push `on` → toggle the reminder,
 * `off` → the same button turns push on first. Denied / unsupported / install
 * states show nothing (the notifications toggle explains those).
 */
export function useRoomReminderControls(): (room: RoomSummary) => RoomReminderControl | null {
  const isMember = Boolean(useAuthStore((s) => s.user));
  const push = usePushNotifications();
  const canRemind = isMember && (push.state === 'on' || push.state === 'off');
  const { data: slugs = [] } = useRoomRemindersQuery(canRemind && push.state === 'on');
  const mutation = useRoomReminderMutation();

  return (room) => {
    if (!canRemind || room.open || !room.hours) return null;
    if (push.state === 'off') return { kind: 'enable', pending: push.isPending, onClick: push.enable };
    const isOn = slugs.includes(room.slug);
    return {
      kind: isOn ? 'on' : 'remind',
      pending: mutation.isPending && mutation.variables?.slug === room.slug,
      onClick: () => mutation.mutate({ slug: room.slug, on: !isOn }),
    };
  };
}
