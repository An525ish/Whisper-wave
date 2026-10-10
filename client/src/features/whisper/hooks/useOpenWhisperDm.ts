import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { track } from '@/shared/lib/analytics';
import { WHISPER_EVENTS } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { trackSessionEnd } from '../stores/trackSessionEnd';
import type { DmOpenSource } from '../types';
import { ROUTES } from '@/shared/constants/routes';

/**
 * The one place a whisper becomes a DM: analytics, session end and navigation.
 *
 * Idempotent per chat. Three independent paths can learn about the same
 * connection (the anon socket, the authed socket, the post-sign-in resume), and a
 * metric that counts it three times — or a double toast — is worse than none.
 * Returns whether THIS call opened it.
 */
export function useOpenWhisperDm() {
  const navigate = useNavigate();
  return useCallback(
    (chatId: string, source: DmOpenSource): boolean => {
      const store = useAnonStore.getState();
      if (store.openedChatId === chatId) return false;
      store.markDmOpened(chatId);
      track(WHISPER_EVENTS.DM_OPENED, { source });
      trackSessionEnd('connected');
      navigate(ROUTES.chat(chatId));
      return true;
    },
    [navigate]
  );
}

/**
 * Handler for the authed socket's `WHISPER_CONNECTION_READY`: the partner
 * finished connecting while this user was elsewhere in the app. Mounted by the app
 * shell, which only wires it to the socket.
 */
export function useWhisperConnectionReady() {
  const openDm = useOpenWhisperDm();
  return useCallback(
    (res: { chatId?: string }) => {
      if (!res.chatId) return;
      if (openDm(res.chatId, 'connection_ready')) toast('You’re connected — say hi ✨');
    },
    [openDm]
  );
}
