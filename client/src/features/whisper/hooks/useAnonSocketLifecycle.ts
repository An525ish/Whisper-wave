import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { BASE_URL } from '@/shared/constants/app';
import {
  ANON_REQUEUE,
  QUEUE_JOINED,
  MATCH_FOUND,
  MATCH_MESSAGE,
  MATCH_TYPING_START,
  MATCH_TYPING_STOP,
  SOMEONE_VIBING,
  MUTUAL_LIKE,
  MATCH_DISCONNECTED,
  MATCH_ERROR,
  MATCH_MESSAGE_REJECTED,
  MATCH_PARTNER_VIBED,
  SESSION_EXPIRED,
  CONNECTION_READY,
  type MatchFoundPayload,
  type QueueJoinedPayload,
  type MatchMessagePayload,
} from '@/shared/constants/anonEvents';
import { useAnonStore } from '../stores/anonStore';
import { ANALYTICS, track } from '@/shared/lib/analytics';

type Options = {
  onPartnerTyping: (isTyping: boolean) => void;
  onSocketError: (msg: string) => void;
};

export type AnonSocketRef = { current: Socket | null };

/**
 * Owns the `/anon` socket connection and every inbound event handler.
 *
 * Split from `useAnonSocket` because the lifecycle (connect/reconnect/teardown)
 * and the imperative send actions have genuinely different lifetimes: this one
 * must NOT re-run when a handler identity changes, or a re-render would drop
 * every active match.
 */
export function useAnonSocketLifecycle({ onPartnerTyping, onSocketError }: Options): AnonSocketRef {
  const socketRef = useRef<Socket | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const typingRef = useRef(onPartnerTyping);
  const errorRef = useRef(onSocketError);

  const status = useAnonStore((s) => s.status);
  const anonId = useAnonStore((s) => s.anonId);
  const shouldConnect = status !== 'idle' && Boolean(anonId);

  useEffect(() => { typingRef.current = onPartnerTyping; }, [onPartnerTyping]);
  useEffect(() => { errorRef.current = onSocketError; }, [onSocketError]);

  useEffect(() => {
    const store = useAnonStore.getState;

    if (!shouldConnect) {
      intentionalDisconnectRef.current = true;
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    intentionalDisconnectRef.current = false;

    const socket = io(`${BASE_URL}/anon`, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
      timeout: 20_000,
    });
    socketRef.current = socket;

    // Kick off a join attempt whenever the socket is (re)established. The server
    // resumes an interrupted match if one exists, otherwise it re-enters the
    // queue — so a refresh or a dropped connection is never a dead end.
    const enterQueue = () => {
      if (store().status !== 'idle') socket.emit(ANON_REQUEUE, {});
    };

    const applyBuffered = (buffered: MatchFoundPayload['bufferedMessages']) => {
      if (!buffered?.length) return;
      const myId = store().anonId;
      store().setMessages(
        buffered.map((m, i) => ({
          id: m.id ?? `hist_${m.sentAt}_${i}`,
          from: m.from === myId ? 'me' : 'them',
          content: m.content,
          sentAt: m.sentAt,
          delivery: m.from === myId ? ('sent' as const) : undefined,
        }))
      );
    };

    socket.on('connect', () => {
      store().setSocketConnected(true);
      if (store().sessionNotice === 'Reconnecting…') store().setSessionNotice(null);
      enterQueue();
    });

    socket.on('disconnect', (reason) => {
      store().setSocketConnected(false);
      if (intentionalDisconnectRef.current) return;

      const st = store().status;
      // The server keeps the match alive for a grace period, so this is a blip,
      // not an ending. Say so instead of implying the chat is over.
      if (st === 'waiting' || st === 'matched') store().setSessionNotice('Reconnecting…');
      if (reason === 'io server disconnect') {
        errorRef.current('Connection closed by server. Retrying…');
      }
    });

    socket.on(QUEUE_JOINED, (data: QueueJoinedPayload) => {
      store().setQueueSize(data?.queueSize ?? null);
      if (store().status === 'matched') return;
      store().setStatus('waiting');
      store().setSessionNotice(null);
      store().setError(null);
    });

    socket.on(MATCH_FOUND, (data: MatchFoundPayload) => {
      const state = store();
      if (state.sessionId === data.sessionId && state.status === 'matched') {
        applyBuffered(data.bufferedMessages);
        state.setSessionNotice(null);
        return;
      }
      state.setMatch(data.sessionId, data.partner.displayName, data.partner.vibeTags);
      applyBuffered(data.bufferedMessages);
      track(ANALYTICS.WHISPER_MATCHED, {
        bufferSize: data.bufferedMessages?.length ?? 0,
        isResume: Boolean(state.sessionId),
      });
    });

    socket.on(MATCH_MESSAGE, (data: MatchMessagePayload) => {
      store().appendMessage({
        id: data.id ?? `r_${data.sentAt}_${Math.random().toString(36).slice(2, 8)}`,
        from: 'them',
        content: data.content,
        sentAt: data.sentAt,
      });
    });

    socket.on(MATCH_TYPING_START, () => typingRef.current(true));
    socket.on(MATCH_TYPING_STOP, () => typingRef.current(false));

    // The partner liked. We record the fact even if we're not eligible to like
    // back yet — otherwise a like landing during the warm-up window was lost
    // forever and the recipient never learned it had happened.
    socket.on(SOMEONE_VIBING, () => typingRef.current(false));
    socket.on(MATCH_PARTNER_VIBED, () => store().setPartnerVibed(true));

    socket.on(MUTUAL_LIKE, (data: { connectToken: string }) => {
      if (!store().likeSent) store().sendLike();
      store().setMutualLike(data.connectToken);
      track(ANALYTICS.WHISPER_MUTUAL, {});
    });

    socket.on(MATCH_DISCONNECTED, (data?: { reason?: string }) => {
      const { matchedAt, messages } = store();
      const reason = data?.reason ?? 'unknown';
      track(ANALYTICS.WHISPER_PARTNER_LEFT, { reason });
      if (matchedAt) {
        track(ANALYTICS.WHISPER_SESSION_END, {
          durationMs: Date.now() - matchedAt,
          messageCount: messages.length,
          reason,
        });
      }
      // Stay in the thread: the conversation is still readable and the user
      // decides whether to move on. `partner_left` keeps the socket connected
      // (this hook connects whenever status isn't `idle`), so finding someone
      // new costs no fresh handshake.
      store().markPartnerLeft();
      typingRef.current(false);
    });

    socket.on(CONNECTION_READY, (data: { chatId: string; connectionId: string }) => {
      if (!data?.chatId) return;
      store().setConnected(data.chatId, data.connectionId);
    });

    // A message the server refused (moderation / rate limit). The optimistic
    // bubble is already on screen — settle it so it isn't a silent lie.
    socket.on(MATCH_MESSAGE_REJECTED, (data: { id?: string; message: string }) => {
      if (data?.id) store().settleMessage(data.id, 'failed', data.message);
      else errorRef.current(data?.message ?? 'That message was not sent.');
    });

    // Surface on-screen rather than swallowing it on non-picker screens.
    socket.on(MATCH_ERROR, (data: { message: string }) => {
      const message = data?.message ?? 'Something went wrong.';
      store().setError(message);
      errorRef.current(message);
    });

    // The server has no identity for us (24 h card lapsed, or a long-dead
    // session). Go back to the picker instead of spinning forever.
    socket.on(SESSION_EXPIRED, () => {
      const state = store();
      state.clearSession();
      state.setStatus('idle');
      state.setError('Your whisper session expired. Pick an alias to jump back in.');
    });

    socket.on('connect_error', (err) => {
      store().setSocketConnected(false);
      errorRef.current(err.message);
    });

    socket.connect();

    return () => {
      intentionalDisconnectRef.current = true;
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
    // Lifetime is tied to "am I in a match at all" — nothing else may re-run it.
  }, [shouldConnect, anonId]);

  return socketRef;
}

/** Partner typing indicator state, colocated with the socket that drives it. */
export function usePartnerTyping(): [boolean, (v: boolean) => void] {
  const [typing, setTyping] = useState(false);
  return [typing, setTyping];
}
