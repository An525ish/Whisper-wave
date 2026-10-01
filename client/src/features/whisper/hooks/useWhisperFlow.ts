import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnonStore } from '../stores/anonStore';
import { useAnonSocket } from './useAnonSocket';
import { useAnonChat } from './useAnonChat';
import { usePartnerTyping } from './useAnonSocketLifecycle';
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

  const { sendMessage, sendLikeEvent, sendNext, retryMessage, emitTypingStart, emitTypingStop } =
    useAnonSocket(setPartnerTyping, setError);

  const { draft, messages, handleDraftChange, clearDraft } = useAnonChat(
    emitTypingStart,
    emitTypingStop
  );

  // A real DM exists (we completed, or CONNECTION_READY arrived because the
  // partner completed) — drop into it.
  useEffect(() => {
    if (status === 'connected' && chatId) {
      track(ANALYTICS.WHISPER_DM_OPENED, { source: 'whisper' });
      navigate(`/chat/${chatId}`);
    }
  }, [status, chatId, navigate]);

  // Browser back must not silently destroy a live match — step back to the
  // waiting room instead of leaving /whisper entirely.
  useEffect(() => {
    if (status !== 'matched' && status !== 'waiting') return;
    const onPop = () => {
      if (useAnonStore.getState().status === 'matched') sendNext();
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
      myName: displayName,
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
