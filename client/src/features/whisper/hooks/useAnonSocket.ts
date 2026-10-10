import { useCallback } from 'react';
import { track } from '@/shared/lib/analytics';
import {
  ACK_TIMEOUT_MS,
  ANON_LIKE,
  ANON_MESSAGE,
  ANON_NEXT,
  ANON_REACT,
  ANON_TYPING_START,
  ANON_TYPING_STOP,
  LIKE_ACK_TIMEOUT_MS,
  LIKE_FAIL_COPY,
  LIKE_FAIL_FALLBACK,
  WHISPER_EVENTS,
} from '../constants';
import { joinQueue } from '../api/match';
import { useAnonStore } from '../stores/anonStore';
import { trackSessionEnd } from '../stores/trackSessionEnd';
import { isVibeUnlocked } from '../utils/isVibeUnlocked';
import type {
  AnonLikeAck,
  AnonMessageAck,
  AnonReaction,
  AnonReactionAck,
  AnonSocketRef,
  NextSource,
} from '../types';

const newMessageId = (): string => {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return c.randomUUID();
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const TIMEOUT_REASON = 'No reply from the server — tap to resend.';

/**
 * The imperative half of the anon socket: send actions over the connection
 * owned by `WhisperSessionProvider` (via `useAnonSocketLifecycle`).
 *
 * Every message send is **acked**. Messages are appended optimistically but marked
 * `sending` until the server confirms, so a message rejected by moderation or
 * the rate limiter can never sit in the thread looking delivered.
 */
export function useAnonSocket(socketRef: AnonSocketRef, onError: (msg: string) => void) {

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

          // A reused id means this exact message already landed (a retry whose
          // first ack was lost) — it is delivered, not failed.
          const delivered = res?.ok || res?.code === 'duplicate_id';
          settle(delivered ? 'sent' : 'failed', res?.reason);

          // `session_ended` is the one definitive proof our view of the match is
          // stale; hand the user the find-someone prompt instead of a dead chat.
          if (res?.code === 'session_ended') {
            trackSessionEnd('session_ended');
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
      track(WHISPER_EVENTS.MESSAGE_SENT, {});
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
    if (!socket?.connected || !state.sessionId || state.likeSent || state.mutualLike) return;
    if (!isVibeUnlocked(state.messages, state.matchedAt)) {
      // The header heart stays tappable before the gate opens, so this is the
      // user-facing explanation. The server re-checks regardless.
      onError('Chat a little longer before sending a vibe.');
      return;
    }
    const sessionId = state.sessionId;
    state.sendLike();
    socket
      .timeout(LIKE_ACK_TIMEOUT_MS)
      .emit(ANON_LIKE, {}, (err: Error | null, res?: AnonLikeAck) => {
        const now = useAnonStore.getState();
        // The thread moved on (skip / new match) before the ack: nothing to settle.
        if (now.sessionId !== sessionId) return;
        if (!err && res?.ok) {
          track(WHISPER_EVENTS.LIKE_SENT, {});
          return; // MUTUAL_LIKE drives the modal.
        }
        // No ack (lost, or an old server) or a refusal: undo the heart.
        if (!now.rollbackLike()) return;
        if (err) return onError(LIKE_FAIL_FALLBACK);
        onError(LIKE_FAIL_COPY[res?.ok === false ? res.code : ''] ?? LIKE_FAIL_FALLBACK);
      });
  }, [socketRef, onError]);

  /**
   * Skip the current match and queue for the next one.
   *
   * If the identity was edited since the server last saved it, the card is
   * rewritten (`POST /match/join`) BEFORE `ANON_NEXT`, because the server re-queues
   * us from the stored card. A failed rewrite falls back to the old card.
   */
  const sendNext = useCallback(
    async (from: NextSource) => {
      const socket = socketRef.current;
      const state = useAnonStore.getState();
      track(WHISPER_EVENTS.NEXT, { from });
      trackSessionEnd('skip');

      const refresh =
        state.identityDirty && state.displayName.trim()
          ? {
              displayName: state.displayName.trim(),
              vibeTags: state.vibeTags,
              gender: state.gender,
              ageConfirmed: true,
            }
          : null;

      state.clearSession();
      state.setStatus('waiting');
      if (!socket?.connected) {
        onError('Not connected. Reconnecting…');
        return;
      }
      if (refresh) {
        try {
          await joinQueue(refresh);
          useAnonStore.getState().markIdentitySynced();
        } catch {
          onError('Couldn’t save your new alias — this match uses the old one.');
        }
      }
      socket.emit(ANON_NEXT, {});
    },
    [socketRef, onError]
  );

  /** End a live match for good (Back-confirm). The caller then leaves the queue. */
  const endMatch = useCallback(() => {
    if (!useAnonStore.getState().sessionId) return;
    trackSessionEnd('leave');
    // Tell the partner now rather than leaving them a 45 s reconnect grace period.
    socketRef.current?.emit(ANON_NEXT, {});
  }, [socketRef]);

  /**
   * React to one message.
   *
   * Optimistic: the store applies the toggle immediately and `MATCH_REACTION`
   * arrives back to BOTH participants, which settles our own tap from the server's
   * answer. The ack only matters on refusal, where we restore what the bubble held.
   */
  const sendReaction = useCallback(
    (messageId: string, reaction: AnonReaction) => {
      const socket = socketRef.current;
      const state = useAnonStore.getState();
      if (!socket?.connected || !state.sessionId || !messageId) return;

      const previous = state.messages.find((m) => m.id === messageId)?.reactions?.me;
      state.applyReaction(messageId, 'me', reaction);
      track(WHISPER_EVENTS.REACTED, { reaction });
      socket.emit(ANON_REACT, { messageId, reaction }, (res?: AnonReactionAck) => {
        if (res?.ok === false) {
          useAnonStore.getState().setReaction(messageId, 'me', previous);
        }
      });
    },
    [socketRef]
  );

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
    endMatch,
    sendReaction,
    retryMessage,
    emitTypingStart,
    emitTypingStop,
  };
}
