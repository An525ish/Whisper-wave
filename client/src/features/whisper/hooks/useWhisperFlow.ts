import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnonStore } from '../stores/anonStore';
import { useAnonSocket } from './useAnonSocket';
import { useAnonChat } from './useAnonChat';
import { usePartnerTyping } from './useAnonSocketLifecycle';
import { usePartnerLeftPrompt } from './usePartnerLeftPrompt';
import { useWhisperConnectResume } from './useWhisperConnectResume';
import {
  useJoinQueueMutation,
  useLeaveQueueMutation,
} from './useMatchQueueMutations';
import { ANALYTICS, track } from '@/shared/lib/analytics';

/**
 * The whole Whisper flow as one controller.
 *
 * `pages/Whisper.tsx` used to hold ~20 store subscriptions, the redirect
 * effect, the popstate business rule, the error-precedence chain and every
 * analytics call. A page is a route entry — all of that belongs here.
 */
export function useWhisperFlow() {
  const navigate = useNavigate();

  // Match state
  const status = useAnonStore((s) => s.status);
  const displayName = useAnonStore((s) => s.displayName);
  // The current thread is called by the alias this match started with. Editing
  // the identity from the panel changes `displayName` for the *next* match, so
  // without this the thread would retroactively rename itself.
  const sessionAlias = useAnonStore((s) => s.sessionAlias);
  const sessionId = useAnonStore((s) => s.sessionId);
  const partnerName = useAnonStore((s) => s.partnerName);
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const queueSize = useAnonStore((s) => s.queueSize);

  // Like state
  const likeSent = useAnonStore((s) => s.likeSent);
  const mutualLike = useAnonStore((s) => s.mutualLike);
  const connectToken = useAnonStore((s) => s.connectToken);
  const partnerVibed = useAnonStore((s) => s.partnerVibed);
  const matchedAt = useAnonStore((s) => s.matchedAt);
  const mutualVibeDismissed = useAnonStore((s) => s.mutualVibeDismissed);
  const dismissMutualVibePrompt = useAnonStore((s) => s.dismissMutualVibePrompt);
  const openMutualVibePrompt = useAnonStore((s) => s.openMutualVibePrompt);

  // Transport
  const socketConnected = useAnonStore((s) => s.socketConnected);
  // Reconnect blips only — no longer used for "they moved on" banners.
  const sessionNotice = useAnonStore((s) => s.sessionNotice);
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
    sendReaction,
    retryMessage,
    emitTypingStart,
    emitTypingStop,
  } = useAnonSocket(setPartnerTyping, setError);

  const { draft, messages, handleDraftChange, clearDraft } = useAnonChat(
    emitTypingStart,
    emitTypingStop
  );

  // "Find someone new" from the partner-left state. Identical to skip: end our
  // side, re-enter the queue. `ANON_NEXT` already handles a session the server
  // has torn down, so this is safe whether or not the partner's exit was clean.
  const findSomeoneNew = useCallback(() => {
    track(ANALYTICS.WHISPER_NEXT, { from: 'partner_left' });
    sendNext();
  }, [sendNext]);

  const { showPrompt: partnerLeftPromptExpanded } = usePartnerLeftPrompt(findSomeoneNew);

  const dismissPartnerLeftPrompt = useAnonStore((s) => s.dismissPartnerLeftPrompt);

  // A real DM exists (we completed, or CONNECTION_READY arrived because the
  // partner completed) — drop into it.
  useEffect(() => {
    if (status === 'connected' && chatId) {
      track(ANALYTICS.WHISPER_DM_OPENED, { source: 'whisper' });
      navigate(`/chat/${chatId}`);
    }
  }, [status, chatId, navigate]);

  // Browser back must not silently destroy a live match — step back to the
  // waiting room instead of leaving /whisper entirely. `partner_left` counts as
  // live: there is still a readable thread on screen.
  useEffect(() => {
    if (status !== 'matched' && status !== 'waiting' && status !== 'partner_left') return;
    const onPop = () => {
      const current = useAnonStore.getState().status;
      if (current === 'matched' || current === 'partner_left') sendNext();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [status, sendNext]);

  return {
    status,
    picker: {
      onJoin: (payload: Parameters<typeof joinMutation.mutate>[0]) => {
        track(ANALYTICS.WHISPER_JOIN, { tagCount: payload.vibeTags.length });
        joinMutation.mutate(payload);
      },
      loading: joinMutation.isPending,
      error,
    },
    waiting: {
      displayName,
      socketConnected,
      sessionNotice,
      queueSize,
      onLeave: leaveMutation.mutate,
    },
    chat: {
      myName: sessionAlias ?? displayName,
      partnerName: partnerName ?? 'Stranger',
      partnerTags,
      messages,
      draft,
      partnerTyping,
      likeSent,
      mutualLike,
      partnerVibed,
      connectToken,
      showMutualModal: Boolean(
        mutualLike && connectToken && !mutualVibeDismissed
      ),
      matchedAt,
      sessionId,
      socketConnected,
      sessionNotice,
      error,
      partnerLeft: status === 'partner_left',
      partnerLeftPromptExpanded,
      onFindSomeoneNew: findSomeoneNew,
      onStayOnEndedThread: dismissPartnerLeftPrompt,
      onReact: sendReaction,
      onDraftChange: handleDraftChange,
      onSend: (content: string) => {
        sendMessage(content);
        track(ANALYTICS.WHISPER_MESSAGE_SENT, {});
      },
      onLike: () => {
        track(ANALYTICS.WHISPER_LIKE_SENT, {});
        sendLikeEvent();
      },
      onNext: () => {
        track(ANALYTICS.WHISPER_NEXT, {});
        sendNext();
      },
      onClearDraft: clearDraft,
      onRetry: retryMessage,
      onCloseMutualModal: dismissMutualVibePrompt,
      onOpenMutualModal: openMutualVibePrompt,
      onDismissError: () => setError(null),
    },
  };
}

export { useWhisperConnectResume };
