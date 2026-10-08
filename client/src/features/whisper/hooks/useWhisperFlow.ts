import { useCallback, useEffect } from 'react';
import { track } from '@/shared/lib/analytics';
import { RESUME_DEADLINE_MS, RESUME_ENDED_NOTICE, WHISPER_EVENTS } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { trackSessionEnd } from '../stores/trackSessionEnd';
import { readStoredIdentity } from '../utils/anonIdentityStorage';
import { clearResumeFlag, hasResumeFlag } from '../utils/resumeFlag';
import { useAuthStore } from '@/features/auth';
import { useAccountBinding } from './useAccountBinding';
import { useAnonChat } from './useAnonChat';
import { useAnonSocket } from './useAnonSocket';
import { usePartnerTyping } from './useAnonSocketLifecycle';
import { useLeaveGuard } from './useLeaveGuard';
import { useJoinQueueMutation, useLeaveQueueMutation } from './useMatchQueueMutations';
import { useOpenWhisperDm } from './useOpenWhisperDm';
import type { JoinQueuePayload, NextSource } from '../types';

/**
 * The whole Whisper flow as one controller.
 *
 * `pages/Whisper.tsx` is a route entry — the store selection, the redirect, the
 * Back-button rule, the leave/skip confirms and every analytics call live here.
 */
export function useWhisperFlow() {
  useAccountBinding();
  const openDm = useOpenWhisperDm();

  // Match state
  const status = useAnonStore((s) => s.status);
  const displayName = useAnonStore((s) => s.displayName);
  // The current thread is called by the alias this match started with. Editing
  // the identity from the panel changes `displayName` for the *next* match.
  const sessionAlias = useAnonStore((s) => s.sessionAlias);
  const sessionId = useAnonStore((s) => s.sessionId);
  const partnerName = useAnonStore((s) => s.partnerName);
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const queueSize = useAnonStore((s) => s.queueSize);

  // Like state
  const likeSent = useAnonStore((s) => s.likeSent);
  const mutualLike = useAnonStore((s) => s.mutualLike);
  const connectToken = useAnonStore((s) => s.connectToken);
  const mutualAt = useAnonStore((s) => s.mutualAt);
  const partnerVibed = useAnonStore((s) => s.partnerVibed);
  const matchedAt = useAnonStore((s) => s.matchedAt);
  const mutualVibeDismissed = useAnonStore((s) => s.mutualVibeDismissed);
  const dismissMutualVibePrompt = useAnonStore((s) => s.dismissMutualVibePrompt);
  const openMutualVibePrompt = useAnonStore((s) => s.openMutualVibePrompt);
  const partnerLeftDismissed = useAnonStore((s) => s.partnerLeftPromptDismissed);
  const dismissPartnerLeftPrompt = useAnonStore((s) => s.dismissPartnerLeftPrompt);

  // Transport
  const socketConnected = useAnonStore((s) => s.socketConnected);
  const reconnecting = useAnonStore((s) => s.reconnecting);
  const error = useAnonStore((s) => s.error);
  const setError = useAnonStore((s) => s.setError);
  const chatId = useAnonStore((s) => s.chatId);

  const [partnerTyping, setPartnerTyping] = usePartnerTyping();
  const joinMutation = useJoinQueueMutation();
  const leaveMutation = useLeaveQueueMutation();

  const {
    sendMessage,
    sendLikeEvent,
    sendNext,
    endMatch,
    sendReaction,
    retryMessage,
    emitTypingStart,
    emitTypingStop,
  } = useAnonSocket(setPartnerTyping, setError);

  const { draft, messages, handleDraftChange, clearDraft } = useAnonChat(
    emitTypingStart,
    emitTypingStop
  );

  // Refresh-restore: an empty store plus the marker means a match was live in this
  // tab. Reconnect with `auth.resume` (the lifecycle hook) instead of queueing.
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

  // The server never answered (neither MATCH_FOUND nor SESSION_EXPIRED).
  useEffect(() => {
    if (status !== 'resuming') return;
    const id = window.setTimeout(
      () => useAnonStore.getState().abortResume(RESUME_ENDED_NOTICE),
      RESUME_DEADLINE_MS
    );
    return () => window.clearTimeout(id);
  }, [status]);

  const live = status === 'matched' || status === 'partner_left';
  const guard = useLeaveGuard(live);

  /** Skip: end our side, clear the composer, re-enter the queue. */
  const skip = useCallback(
    (from: NextSource) => {
      clearDraft();
      setPartnerTyping(false);
      void sendNext(from);
    },
    [clearDraft, setPartnerTyping, sendNext]
  );

  /** Leave for good: tell the partner, drop out of the queue, back to the picker. */
  const leaveMatch = useCallback(() => {
    clearDraft();
    setPartnerTyping(false);
    clearResumeFlag();
    endMatch();
    leaveMutation.mutate();
  }, [clearDraft, setPartnerTyping, endMatch, leaveMutation]);

  // The chevron skips, but only after confirming — unless the thread is already over.
  const requestSkip = () => {
    if (status === 'partner_left') skip('partner_left');
    else guard.ask('skip');
  };

  const resolveConfirm = (accept: boolean) => {
    const kind = guard.pending;
    guard.clear();
    if (!accept || !kind) return;
    if (kind === 'leave') leaveMatch();
    else skip('chat');
  };

  // A real DM exists (we completed, or CONNECTION_READY arrived because the
  // partner completed) — drop into it, exactly once.
  useEffect(() => {
    if (status === 'connected' && chatId) openDm(chatId, 'whisper');
  }, [status, chatId, openDm]);

  // The store outlives the route; revisiting /whisper must start at the picker
  // with no half-finished match behind it.
  useEffect(
    () => () => {
      trackSessionEnd('navigate_away');
      useAnonStore.getState().reset();
    },
    []
  );

  return {
    // The resume notice is a variant of the waiting room, not a separate screen.
    status: status === 'resuming' ? ('waiting' as const) : status,
    picker: {
      onJoin: (payload: JoinQueuePayload) => {
        track(WHISPER_EVENTS.JOIN, { tagCount: payload.vibeTags.length });
        joinMutation.mutate(payload);
      },
      loading: joinMutation.isPending,
      error,
    },
    waiting: {
      displayName,
      socketConnected,
      reconnecting,
      queueSize,
      resuming: status === 'resuming',
      onLeave: leaveMutation.mutate,
    },
    chat: {
      myName: sessionAlias || displayName || 'You',
      partnerName: partnerName ?? 'Stranger',
      partnerTags,
      messages,
      draft,
      partnerTyping,
      likeSent,
      mutualLike,
      partnerVibed,
      connectToken,
      mutualAt,
      showMutualModal: Boolean(mutualLike && connectToken && !mutualVibeDismissed),
      matchedAt,
      sessionId,
      socketConnected,
      reconnecting,
      error,
      partnerLeft: status === 'partner_left',
      partnerLeftDismissed,
      confirmKind: guard.pending,
      onResolveConfirm: resolveConfirm,
      onRequestSkip: requestSkip,
      onFindSomeoneNew: () => skip('partner_left'),
      onStayOnEndedThread: dismissPartnerLeftPrompt,
      onReact: sendReaction,
      onDraftChange: handleDraftChange,
      onSend: sendMessage,
      onLike: sendLikeEvent,
      onReported: () => skip('report'),
      onLeaveAfterExpiry: leaveMatch,
      onClearDraft: clearDraft,
      onRetry: retryMessage,
      onCloseMutualModal: dismissMutualVibePrompt,
      onOpenMutualModal: openMutualVibePrompt,
      onDismissError: () => setError(null),
    },
  };
}
