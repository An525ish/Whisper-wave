import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { completeConnection } from '../api/connection';
import { useAnonStore } from '../stores/anonStore';
import { WHISPER_CONNECT_TOKEN_KEY } from '../constants';
import { ANALYTICS, track } from '@/shared/lib/analytics';

/**
 * Finish a Whisper "connect & reveal".
 *
 * Three outcomes, all of which used to live in the modal's component body:
 *  - signed out → stash the token and bounce to /auth
 *  - signed in, partner hasn't connected yet → stay put and say so
 *  - both connected → a real DM exists, drop the user into it
 */
export function useCompleteConnection() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setConnected = useAnonStore((s) => s.setConnected);
  const [waiting, setWaiting] = useState(false);

  const goToAuth = (connectToken: string) => {
    sessionStorage.setItem(WHISPER_CONNECT_TOKEN_KEY, connectToken);
    navigate('/auth', { state: { intent: 'whisper-connect' } });
  };

  const mutation = useMutation({
    mutationFn: (connectToken: string) => completeConnection(connectToken),
    onSuccess: (res) => {
      if (res.data.status === 'connected') {
        track(ANALYTICS.WHISPER_DM_OPENED, { source: 'mutual_vibe_modal' });
        setConnected(res.data.chatId, res.data.connectionId);
        navigate(`/chat/${res.data.chatId}`);
        return;
      }
      setWaiting(true);
    },
    onError: (_err, connectToken) => {
      // An expired/absent session is the expected path for a guest — send them
      // to sign in rather than showing a dead-end error.
      goToAuth(connectToken);
    },
  });

  const connect = (connectToken: string) => {
    setWaiting(false);
    if (!user) {
      track(ANALYTICS.WHISPER_DM_OPENED, { source: 'auth_redirect' });
      goToAuth(connectToken);
      return;
    }
    mutation.mutate(connectToken);
  };

  return {
    connect,
    isPending: mutation.isPending,
    isWaitingForPartner: waiting,
    error:
      mutation.isError && mutation.error instanceof Error
        ? mutation.error.message
        : null,
  };
}
