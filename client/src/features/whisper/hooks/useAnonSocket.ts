import { useCallback } from 'react';
import { ANON_MESSAGE, ANON_LIKE, ANON_NEXT, ANON_REQUEUE, ANON_TYPING_START, ANON_TYPING_STOP, type AnonMessageAck } from '@/shared/constants/anonEvents';
import { useAnonSocketLifecycle, type AnonSocketRef } from './useAnonSocketLifecycle';
import { useAnonStore } from '../stores/anonStore';
import { isVibeUnlocked } from '../utils/isVibeUnlocked';
import { ACK_TIMEOUT_MS } from '../constants';

const newMessageId = (): string => {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return c.randomUUID();
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const TIMEOUT_REASON = 'No reply from the server — tap to resend.';

type UseAnonSocketReturn = {
  sendMessage: (content: string) => void;
  sendLikeEvent: () => void;
  sendNext: () => void;
  requeue: () => void;
  retryMessage: (id: string) => void;
  emitTypingStart: () => void;
  emitTypingStop: () => void;
};

/**
 * The imperative half of the anon socket: send actions over the connection
 * owned by `useAnonSocketLifecycle`.
 *
 * Every send is **acked**. Messages are appended optimistically but marked
 * `sending` until the server confirms, so a message rejected by moderation or
 * the rate limiter can never sit in the thread looking delivered.
 */
export function useAnonSocket(
  onPartnerTyping: (isTyping: boolean) => void,
  onError: (msg: string) => void
): UseAnonSocketReturn {
  const socketRef: AnonSocketRef = useAnonSocketLifecycle({
    onPartnerTyping,
    onSocketError: onError,
  });

  /** Emit a message and settle its optimistic bubble from the ack. */
  const emitWithAck = useCallback(
    (id: string, content: string) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        useAnonStore.getState().settleMessage(id, 'failed', TIMEOUT_REASON);
        return;
      }
      let settled = false;
      const settle = (delivery: 'sent' | 'failed', reason?: string) => {
        if (settled) return;
        settled = true;
        useAnonStore.getState().settleMessage(id, delivery, reason);
      };

      socket
        .timeout(ACK_TIMEOUT_MS)
        .emit(ANON_MESSAGE, { content, id }, (err: Error | null, res: AnonMessageAck) => {
          if (err) return settle('failed', TIMEOUT_REASON);

          // The server saying "this session is over" is the one definitive proof
          // we get that our view of the match is stale. Without this the client
          // keeps rendering a live chat whose every message fails forever, and
          // the user has no way to learn the thread is dead — `MATCH_DISCONNECTED`
          // is the normal signal and it can be missed.
          //
          // Settle the bubble first so the text they typed is visibly unsent,
          // then hand them the find-someone prompt.
          settle(res?.ok ? 'sent' : 'failed', res?.reason);
          if (res?.code === 'session_ended') {
            useAnonStore.getState().markPartnerLeft();
          }
        });
    },
    [socketRef]
  );

  const sendMessage = useCallback(
    (content: string) => {
      const text = content.trim();
      const store = useAnonStore.getState();
      if (!socketRef.current?.connected || !store.sessionId || !text) return;

      const id = newMessageId();
      store.appendMessage({
        id,
        from: 'me',
        content: text,
        sentAt: Date.now(),
        delivery: 'sending',
      });
      emitWithAck(id, text);
    },
    [socketRef, emitWithAck]
  );

  const retryMessage = useCallback(
    (id: string) => {
      const target = useAnonStore.getState().retryMessage(id);
      if (!target) return;
      emitWithAck(id, target.content);
    },
    [emitWithAck]
  );

  const sendLikeEvent = useCallback(() => {
    const socket = socketRef.current;
    const state = useAnonStore.getState();
    if (!socket?.connected || state.likeSent || state.mutualLike) return;
    if (!isVibeUnlocked(state.messages, state.matchedAt)) {
      // The header heart stays tappable before the gate opens, so this is the
      // user-facing explanation. The server re-checks regardless.
      onError('Chat a little longer before sending a vibe.');
      return;
    }
    state.sendLike();
    socket.emit(ANON_LIKE, {});
  }, [socketRef, onError]);

  const sendNext = useCallback(() => {
    const socket = socketRef.current;
    const state = useAnonStore.getState();
    state.clearSession();
    state.setStatus('waiting');
    state.setSessionNotice(null);
    if (!socket?.connected) {
      onError('Not connected. Reconnecting…');
      return;
    }
    socket.emit(ANON_NEXT, {});
  }, [socketRef, onError]);

  const requeue = useCallback(() => {
    socketRef.current?.emit(ANON_REQUEUE, {});
  }, [socketRef]);

  const emitTypingStart = useCallback(
    () => socketRef.current?.emit(ANON_TYPING_START, {}),
    [socketRef]
  );
  const emitTypingStop = useCallback(
    () => socketRef.current?.emit(ANON_TYPING_STOP, {}),
    [socketRef]
  );

  return {
    sendMessage,
    sendLikeEvent,
    sendNext,
    requeue,
    retryMessage,
    emitTypingStart,
    emitTypingStop,
  };
}
