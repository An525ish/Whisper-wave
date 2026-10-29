import { useCallback, useRef } from 'react';
import { track } from '@/shared/lib/analytics';
import { newClientId } from '@/shared/utils/id';
import {
  ACK_TIMEOUT_MS,
  ANON_LIKE,
  ANON_MESSAGE,
  ANON_NEXT,
  ANON_REACT,
  ANON_READ,
  ANON_TYPING_START,
  ANON_TYPING_STOP,
  LIKE_ACK_TIMEOUT_MS,
  LIKE_FAIL_COPY,
  LIKE_FAIL_FALLBACK,
  WHISPER_EVENTS,
} from '../constants';
import { ANON_IMAGE_MAX_BYTES, ANON_IMAGE_TYPES, uploadAnonImage } from '../api/match';
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
    (id: string, content: string, imageKey?: string, gifUrl?: string) => {
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
        .emit(ANON_MESSAGE, { content, id, ...(imageKey ? { image: { key: imageKey } } : {}), ...(gifUrl ? { gif: { url: gifUrl } } : {}) }, (err: Error | null, res: AnonMessageAck) => {
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

      const id = newClientId();
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

  /**
   * Photos keep their File here (not in the store) so a failed bubble can resend.
   * ponytail: blob URLs are never revoked; a chat holds a handful. Upgrade: revoke on session end.
   */
  const pendingImages = useRef(new Map<string, File>());

  const deliverImage = useCallback(
    async (id: string, file: File, caption: string) => {
      try {
        emitWithAck(id, caption, await uploadAnonImage(file));
      } catch (err) {
        const reason = err instanceof Error && err.message ? err.message : 'Photo did not send';
        useAnonStore.getState().settleMessage(id, 'failed', `${reason}. Tap to resend.`);
      }
    },
    [emitWithAck]
  );

  const sendImage = useCallback(
    (file: File, caption: string) => {
      const store = useAnonStore.getState();
      if (!socketRef.current?.connected || !store.sessionId) return;
      if (!ANON_IMAGE_TYPES.includes(file.type) || file.size > ANON_IMAGE_MAX_BYTES) {
        onError('Only JPG, PNG or WebP photos, up to 5 MB.');
        return;
      }
      const id = newClientId();
      pendingImages.current.set(id, file);
      store.appendMessage({
        id,
        from: 'me',
        content: caption.trim(),
        image: { url: URL.createObjectURL(file) },
        sentAt: Date.now(),
        delivery: 'sending',
      });
      track(WHISPER_EVENTS.MESSAGE_SENT, {});
      void deliverImage(id, file, caption.trim());
    },
    [socketRef, onError, deliverImage]
  );

  /** A GIF or meme from the picker: no upload, the server just vets the URL. */
  const sendGif = useCallback(
    (url: string) => {
      const store = useAnonStore.getState();
      if (!socketRef.current?.connected || !store.sessionId) return;
      const id = newClientId();
      store.appendMessage({ id, from: 'me', content: '', image: { url }, sentAt: Date.now(), delivery: 'sending' });
      track(WHISPER_EVENTS.MESSAGE_SENT, {});
      emitWithAck(id, '', undefined, url);
    },
    [socketRef, emitWithAck]
  );

  const retryMessage = useCallback(
    (id: string) => {
      const target = useAnonStore.getState().retryMessage(id);
      if (!target) return;
      const file = pendingImages.current.get(id);
      if (file) void deliverImage(id, file, target.content);
      else if (target.image) emitWithAck(id, target.content, undefined, target.image.url);
      else emitWithAck(id, target.content);
    },
    [emitWithAck, deliverImage]
  );

  const sendLikeEvent = useCallback(() => {
    const socket = socketRef.current;
    const state = useAnonStore.getState();
    if (!socket?.connected || !state.sessionId || state.likeSent || state.mutualLike) return;
    if (!isVibeUnlocked(state.messages)) {
      // The header heart stays tappable before the gate opens, so this is the
      // user-facing explanation. The server re-checks regardless.
      onError('Keep chatting a bit longer, then you can send a vibe.');
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
   * Edits made in the You panel travel WITH the skip (`ANON_NEXT { identity }`) and
   * the server applies them to the stored card before it re-queues us. They used to
   * go through `POST /match/join` first, which the server refuses while the old
   * match is still live, so the partner kept seeing the old vibes. The dirty flag
   * clears only when the server acks that it applied them.
   */
  const sendNext = useCallback(
    (from: NextSource) => {
      const socket = socketRef.current;
      const state = useAnonStore.getState();
      track(WHISPER_EVENTS.NEXT, { from });
      trackSessionEnd('skip');

      const identity =
        state.identityDirty && state.displayName.trim()
          ? { displayName: state.displayName.trim(), vibeTags: state.vibeTags, gender: state.gender }
          : null;

      state.clearSession();
      state.setStatus('waiting');
      if (!socket?.connected) {
        onError('Not connected. Reconnecting…');
        return;
      }
      socket.emit(ANON_NEXT, identity ? { identity } : {}, (res?: { identity?: boolean }) => {
        if (res?.identity) useAnonStore.getState().markIdentitySynced();
      });
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

  const sendRead = useCallback(
    (messageId: string) => socketRef.current?.emit(ANON_READ, { messageId }),
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
    sendImage,
    sendGif,
    sendLikeEvent,
    sendNext,
    endMatch,
    sendReaction,
    sendRead,
    retryMessage,
    emitTypingStart,
    emitTypingStop,
  };
}
