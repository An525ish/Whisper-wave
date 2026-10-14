import { useCallback } from 'react';
import { track } from '@/shared/lib/analytics';
import { ApiError } from '@/shared/lib/api/client';
import { WHISPER_EVENTS } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { clearResumeFlag } from '../utils/resumeFlag';
import { useAnonChat } from './useAnonChat';
import { useAnonSocket } from './useAnonSocket';
import { useLeaveConfirm } from './useLeaveConfirm';
import { useJoinQueueMutation, useLeaveQueueMutation } from './useMatchQueueMutations';
import { useWhisperSession } from './useWhisperSession';
import type { JoinQueuePayload, NextSource } from '../types';

/**
 * The whole Whisper flow as one controller.
 *
 * `pages/Whisper.tsx` is a route entry — the store selection, the redirect,
 * the leave/skip confirms and every analytics call live here. The transport
 * (socket, resume, account binding) lives in `WhisperSessionProvider`, so a
 * live whisper survives navigating away from this route.
 */
export function useWhisperFlow() {
  const { socketRef, partnerTyping, setPartnerTyping } = useWhisperSession();

  // Match state
  const status = useAnonStore((s) => s.status);
  const displayName = useAnonStore((s) => s.displayName);
  // The current thread is called by the alias this match started with. Editing
  // the identity from the panel changes `displayName` for the *next* match.
  const sessionAlias = useAnonStore((s) => s.sessionAlias);
  const partnerName = useAnonStore((s) => s.partnerName);
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const queueSize = useAnonStore((s) => s.queueSize);
  const vibeTags = useAnonStore((s) => s.vibeTags);

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
  const sessionId = useAnonStore((s) => s.sessionId);

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
  } = useAnonSocket(socketRef, setError);

  const { draft, messages, handleDraftChange, clearDraft } = useAnonChat(
    emitTypingStart,
    emitTypingStop
  );

  const guard = useLeaveConfirm();

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
      alreadyChatting: joinMutation.error instanceof ApiError && joinMutation.error.status === 409,
      onDismissAlreadyChatting: joinMutation.reset,
    },
    waiting: {
      displayName,
      socketConnected,
      reconnecting,
      queueSize,
      vibeTags,
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
