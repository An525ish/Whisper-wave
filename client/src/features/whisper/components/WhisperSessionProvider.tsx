import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/features/auth';
import { RESUME_DEADLINE_MS, RESUME_ENDED_NOTICE } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { readStoredIdentity } from '../utils/anonIdentityStorage';
import { hasResumeFlag } from '../utils/resumeFlag';
import { useAccountBinding } from '../hooks/useAccountBinding';
import { useAnonSocketLifecycle } from '../hooks/useAnonSocketLifecycle';
import { useOpenWhisperDm } from '../hooks/useOpenWhisperDm';
import { WhisperSessionContext } from '../hooks/useWhisperSession';

type Props = {
  children: ReactNode;
};

/**
 * Owns the anonymous session for the whole hub visit.
 *
 * The socket connects only while the store is out of `idle` (see
 * `useAnonSocketLifecycle`), so mounting this in the hub shell is free when no
 * whisper is live — and a live whisper survives navigating to Chats, Home and
 * back. The store is the source of truth; this provider only keeps the
 * transport and the cross-route effects (resume, account binding, DM handoff).
 */
export default function WhisperSessionProvider({ children }: Props) {
  useAccountBinding();
  const openDm = useOpenWhisperDm();
  const [partnerTyping, setPartnerTyping] = useState(false);

  const handleSocketError = useCallback((msg: string) => {
    useAnonStore.getState().setError(msg);
  }, []);

  const socketRef = useAnonSocketLifecycle({
    onPartnerTyping: setPartnerTyping,
    onSocketError: handleSocketError,
  });

  // Refresh-restore: an empty store plus the marker means a match was live in
  // this tab. Reconnect with `auth.resume` (the lifecycle hook) instead of
  // queueing.
  const accountId = useAuthStore((s) => s.user?._id);
  useEffect(() => {
    const state = useAnonStore.getState();
    if (state.status !== 'idle' || state.sessionId || !hasResumeFlag()) return;
    // Alias for "me" in the thread; the server only replays the partner's side.
    const stored = readStoredIdentity(accountId);
    if (stored && !state.displayName) {
      state.setIdentityFields(stored.displayName, stored.vibeTags, stored.gender);
    }
    state.setStatus('resuming');
    // Mount-only: later account changes are handled by `bindOwner`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = useAnonStore((s) => s.status);
  const chatId = useAnonStore((s) => s.chatId);

  // The server never answered (neither MATCH_FOUND nor SESSION_EXPIRED).
  useEffect(() => {
    if (status !== 'resuming') return;
    const id = window.setTimeout(
      () => useAnonStore.getState().abortResume(RESUME_ENDED_NOTICE),
      RESUME_DEADLINE_MS
    );
    return () => window.clearTimeout(id);
  }, [status]);

  // A real DM exists (we completed, or CONNECTION_READY arrived because the
  // partner completed) — drop into it, exactly once.
  useEffect(() => {
    if (status === 'connected' && chatId) openDm(chatId, 'whisper');
  }, [status, chatId, openDm]);

  return (
    <WhisperSessionContext.Provider
      value={{ socketRef, partnerTyping, setPartnerTyping }}
    >
      {children}
    </WhisperSessionContext.Provider>
  );
}
