import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import useErrors from '@/shared/hooks/useError';
import { track } from '@/shared/lib/analytics';
import { completeConnection } from '../api/connection';
import { useAnonStore } from '../stores/anonStore';
import { WHISPER_CONNECT_INTENT, WHISPER_CONNECT_TOKEN_KEY, WHISPER_EVENTS } from '../constants';

/**
 * Finish a Whisper "connect & reveal".
 *
 *  - signed out → stash the token and send them to /auth (the only redirect)
 *  - signed in, partner hasn't connected yet → stay put and say so
 *  - both connected → record it in the store; `useWhisperFlow` opens the DM once
 *  - signed in but the call failed → a toast, NOT a bounce to a login they already did
 */
export function useCompleteConnection() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setConnected = useAnonStore((s) => s.setConnected);
  const [waiting, setWaiting] = useState(false);

  const mutation = useMutation({
    mutationFn: (connectToken: string) => completeConnection(connectToken),
    onSuccess: (res) => {
      if (res.data.status === 'connected') {
        setConnected(res.data.chatId, res.data.connectionId);
        return;
      }
      setWaiting(true);
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);

  const connect = (connectToken: string) => {
    setWaiting(false);
    if (!user) {
      // Not a DM open — the guest has only been sent to sign in.
      track(WHISPER_EVENTS.CONNECT_AUTH_REDIRECT, {});
      sessionStorage.setItem(WHISPER_CONNECT_TOKEN_KEY, connectToken);
      navigate('/auth', { state: { intent: WHISPER_CONNECT_INTENT } });
      return;
    }
    mutation.mutate(connectToken);
  };

  return {
    connect,
    isPending: mutation.isPending,
    isWaitingForPartner: waiting,
  };
}
