import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth';
import { ApiError } from '@/shared/lib/api/client';
import { completeConnection } from '../api/connection';
import { WHISPER_CONNECT_TOKEN_KEY } from '../constants';
import { useOpenWhisperDm } from './useOpenWhisperDm';

/** The server rejected the token itself (bad, expired, consumed) — retrying cannot help. */
const isDefinitiveFailure = (err: unknown): boolean =>
  err instanceof ApiError && [400, 401, 403, 404, 410, 422].includes(err.status);

/**
 * Resumes a Whisper "connect & reveal" after the guest signs in.
 *
 * When a not-logged-in user hits a mutual vibe, `MutualVibeModal` stashes the
 * connectToken in sessionStorage and sends them to /auth. After they sign in they
 * land in the app (usually on "/"), NOT on /whisper — so this hook, mounted by the
 * authed app shell, consumes the token as soon as a user exists and finishes the
 * connection they started.
 *
 * Tries at most once per mount. The token is removed only on a definitive
 * outcome; a network blip or 5xx keeps it so the next app load can retry.
 */
export function useWhisperConnectResume(): void {
  const user = useAuthStore((s) => s.user);
  const openDm = useOpenWhisperDm();
  const attempted = useRef(false);

  useEffect(() => {
    if (!user || attempted.current) return;

    const token = sessionStorage.getItem(WHISPER_CONNECT_TOKEN_KEY);
    if (!token) return;

    attempted.current = true;

    void (async () => {
      try {
        const res = await completeConnection(token);
        sessionStorage.removeItem(WHISPER_CONNECT_TOKEN_KEY);

        if (res.data.status === 'connected') {
          openDm(res.data.chatId, 'resume_after_auth');
        } else {
          // We're first — the partner still has to sign in and connect.
          // WHISPER_CONNECTION_READY (authenticated socket) moves us when they
          // do; until then, let them know it's in flight.
          toast('Vibe locked in — waiting for them to connect too.', { icon: '✨' });
        }
      } catch (err) {
        if (isDefinitiveFailure(err)) {
          sessionStorage.removeItem(WHISPER_CONNECT_TOKEN_KEY);
          toast.error('That connect link expired. Start a new Whisper to try again.');
        } else {
          toast.error('Couldn’t finish connecting. We’ll try again next time you open the app.');
        }
      }
    })();
  }, [user, openDm]);
}
