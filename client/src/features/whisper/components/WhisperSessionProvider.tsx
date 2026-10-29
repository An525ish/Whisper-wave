import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/features/auth';
import { RESUME_DEADLINE_MS, RESUME_ENDED_NOTICE } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { readStoredIdentity } from '../utils/anonIdentityStorage';
import { hasResumeFlag, readLiveIdentity } from '../utils/resumeFlag';
import type { Gender, VibeTag } from '../types';
import { useAccountBinding } from '../hooks/useAccountBinding';
import { useAnonSocketLifecycle } from '../hooks/useAnonSocketLifecycle';
import { useWhisperDmHandoff } from '../hooks/useWhisperDmHandoff';
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
  useWhisperDmHandoff();
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
  // queueing. Runs once (ref-guarded) — later account changes are handled by
  // `bindOwner`.
  const accountId = useAuthStore((s) => s.user?._id);
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const state = useAnonStore.getState();
    if (state.status !== 'idle' || state.sessionId || !hasResumeFlag()) return;
    // Alias for "me" in the thread; the server only replays the partner's side.
    const live = readLiveIdentity();
    if (live && !state.displayName) {
      useAnonStore.setState({
        displayName: typeof live.displayName === 'string' ? live.displayName : '',
        vibeTags: Array.isArray(live.vibeTags) ? (live.vibeTags as VibeTag[]) : [],
        gender: (live.gender as Gender) ?? 'prefer_not_to_say',
        sessionAlias: typeof live.sessionAlias === 'string' ? live.sessionAlias : null,
        sessionTags: Array.isArray(live.sessionTags) ? (live.sessionTags as VibeTag[]) : null,
      });
    }
    const stored = readStoredIdentity(accountId);
    if (stored && !useAnonStore.getState().displayName) {
      state.setIdentityFields(stored.displayName, stored.vibeTags, stored.gender);
    }
    state.setStatus('resuming');
  }, [accountId]);

  const status = useAnonStore((s) => s.status);

  // The server never answered (neither MATCH_FOUND nor SESSION_EXPIRED).
  useEffect(() => {
    if (status !== 'resuming') return;
    const id = window.setTimeout(
      () => useAnonStore.getState().abortResume(RESUME_ENDED_NOTICE),
      RESUME_DEADLINE_MS
    );
    return () => window.clearTimeout(id);
  }, [status]);

  return (
    <WhisperSessionContext.Provider
      value={{ socketRef, partnerTyping, setPartnerTyping }}
    >
      {children}
    </WhisperSessionContext.Provider>
  );
}
