import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '@/shared/constants/routes';
import { DM_READY_TOAST_ID, DM_READY_TOAST_MS } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import OpenDmToast from '../components/OpenDmToast';
import { useOpenWhisperDm } from './useOpenWhisperDm';

/** A live room thread: `/rooms/:slug` (not the create page). Leaving it would drop the seat. */
const isRoomThread = (pathname: string): boolean =>
  pathname.startsWith(`${ROUTES.rooms}/`) && pathname !== ROUTES.newRoom;

/**
 * A real DM exists (we completed, or CONNECTION_READY arrived because the
 * partner completed): drop into it, exactly once — except from inside a live
 * room, where navigating would tear the thread down. There it offers an
 * "Open DM" toast instead, and falls back to the normal handoff once the user
 * leaves the room.
 */
export function useWhisperDmHandoff(): void {
  const openDm = useOpenWhisperDm();
  const { pathname } = useLocation();
  const status = useAnonStore((s) => s.status);
  const chatId = useAnonStore((s) => s.chatId);
  const inRoom = isRoomThread(pathname);

  useEffect(() => {
    if (status !== 'connected' || !chatId) return;
    if (!inRoom) {
      toast.dismiss(DM_READY_TOAST_ID);
      openDm(chatId, 'whisper');
      return;
    }
    toast.custom(
      (t) => (
        <OpenDmToast
          onOpen={() => {
            toast.dismiss(t.id);
            openDm(chatId, 'whisper');
          }}
        />
      ),
      { id: DM_READY_TOAST_ID, duration: DM_READY_TOAST_MS }
    );
  }, [status, chatId, inRoom, openDm]);
}
