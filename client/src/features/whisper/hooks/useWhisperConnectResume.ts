import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth';
import { completeConnection } from '../api/connection';
import { WHISPER_CONNECT_TOKEN_KEY } from '../constants';
import { ANALYTICS, track } from '@/shared/lib/analytics';

export { WHISPER_CONNECT_TOKEN_KEY };

/**
 * Resumes a Whisper "connect & reveal" after the guest signs in.
 *
 * When a not-logged-in user hits a mutual vibe, `MutualVibeModal` stashes the
 * connectToken in sessionStorage and sends them to /auth. After they sign in
 * they land in the app (usually on "/"), NOT on /whisper — so this hook, mounted
 * at the router root, consumes the token as soon as a user exists and finishes
 * the connection they started.
 *
 * Runs at most once per stored token; clears it on any terminal outcome so a
 * stale/expired token can never trap the user in a retry loop.
 */
export function useWhisperConnectResume(): void {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const handling = useRef(false);

  useEffect(() => {
    if (!user || handling.current) return;

    const token = sessionStorage.getItem(WHISPER_CONNECT_TOKEN_KEY);
    if (!token) return;

    handling.current = true;

    void (async () => {
      try {
        const res = await completeConnection(token);
        sessionStorage.removeItem(WHISPER_CONNECT_TOKEN_KEY);

        if (res.data.status === 'connected') {
          track(ANALYTICS.WHISPER_DM_OPENED, { source: 'resume_after_auth' });
          navigate(`/chat/${res.data.chatId}`);
        } else {
          // We're first — the partner still has to sign in and connect.
          // WHISPER_CONNECTION_READY (authenticated socket) moves us when they
          // do; until then, let them know it's in flight.
          toast('Vibe locked in — waiting for them to connect too.', { icon: '✨' });
        }
      } catch {
        // Token expired or already consumed — drop it so we don't retry forever.
        sessionStorage.removeItem(WHISPER_CONNECT_TOKEN_KEY);
        toast.error('That connect link expired. Start a new Whisper to try again.');
      } finally {
        handling.current = false;
      }
    })();
  }, [user, navigate]);
}
