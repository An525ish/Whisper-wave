import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { BASE_URL } from '@/shared/constants/app';
import { SOCKET_LIFECYCLE } from '@/shared/constants/socket';
import { CONNECTION_LOST_NOTICE, CONNECTION_REFUSED_NOTICE, RESUME_ENDED_NOTICE } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { bindAnonEvents } from './bindAnonEvents';
import type { AnonSocketRef } from '../types';

interface Params {
  onPartnerTyping: (isTyping: boolean) => void;
  onSocketError: (msg: string) => void;
}

/**
 * Owns the `/anon` socket connection.
 *
 * Exception to "use the shared socket module": the guest `/anon` namespace has its
 * own handshake (httpOnly anonId cookie, no account) and its own lifetime, so it
 * cannot sit behind the app-wide `SocketProvider`; its raw lifecycle names come
 * from `shared/constants/socket.ts`.
 *
 * The socket connects only once the identity card is saved (status leaves
 * `idle`/`joining`). The server pairs or resumes on connect by itself, so the
 * client sends nothing on (re)connect (bar `auth.resume` while restoring a refresh) — a second "requeue" here used to
 * double-queue and replay MATCH_FOUND.
 *
 * Split from `useAnonSocket` because connect/reconnect/teardown and the
 * imperative send actions have different lifetimes: this one must NOT re-run when
 * a handler identity changes, or a re-render would drop every active match.
 */
export function useAnonSocketLifecycle({ onPartnerTyping, onSocketError }: Params): AnonSocketRef {
  const socketRef = useRef<Socket | null>(null);
  const typingRef = useRef(onPartnerTyping);
  const errorRef = useRef(onSocketError);

  const status = useAnonStore((s) => s.status);
  const shouldConnect = status !== 'idle' && status !== 'joining';

  useEffect(() => { typingRef.current = onPartnerTyping; }, [onPartnerTyping]);
  useEffect(() => { errorRef.current = onSocketError; }, [onSocketError]);

  useEffect(() => {
    if (!shouldConnect) return;
    const store = useAnonStore.getState;
    let intentional = false;
    // One notice per outage: reconnection retries forever, and a toast per retry is noise.
    let outageNotified = false;

    const socket = io(`${BASE_URL}/anon`, {
      withCredentials: true,
      // Evaluated on every (re)connect attempt: only a refresh-restore asks the
      // server to replay without queueing; normal connects send nothing.
      auth: (cb) => cb(store().status === 'resuming' ? { resume: true } : {}),
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
      timeout: 20_000,
    });
    socketRef.current = socket;

    socket.on(SOCKET_LIFECYCLE.CONNECT, () => {
      outageNotified = false;
      store().setSocketConnected(true);
      store().setReconnecting(false);
    });

    socket.on(SOCKET_LIFECYCLE.DISCONNECT, (reason) => {
      store().setSocketConnected(false);
      if (intentional) return;
      // The server keeps the match alive for a grace period, so this is a blip,
      // not an ending. Say so instead of implying the chat is over.
      const { status: current } = store();
      if (current === 'waiting' || current === 'matched') store().setReconnecting(true);
      if (reason === 'io server disconnect') {
        errorRef.current('Connection closed by server. Retrying…');
      }
    });

    socket.on(SOCKET_LIFECYCLE.CONNECT_ERROR, (err) => {
      if (store().status === 'resuming') {
        store().abortResume(RESUME_ENDED_NOTICE);
        return;
      }
      store().setSocketConnected(false);
      // The server answered and said no (missing/invalid anon cookie): retrying
      // can never succeed, so stop and send the user back to the picker.
      if (/^Anonymous session not found/i.test(err.message)) {
        intentional = true;
        socket.disconnect();
        store().reset();
        errorRef.current(CONNECTION_REFUSED_NOTICE);
        return;
      }
      // Anything else is transport-level ("websocket error", "timeout", …): the
      // raw text means nothing to a user. Show the reconnecting state and say it once.
      const { status: current } = store();
      if (current === 'waiting' || current === 'matched') store().setReconnecting(true);
      if (!outageNotified) {
        outageNotified = true;
        errorRef.current(CONNECTION_LOST_NOTICE);
      }
    });

    bindAnonEvents(socket, {
      onPartnerTyping: (v) => typingRef.current(v),
      onError: (msg) => errorRef.current(msg),
    });

    socket.connect();

    return () => {
      intentional = true;
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
    // Lifetime is tied to "am I in a match at all" — nothing else may re-run it.
  }, [shouldConnect]);

  return socketRef;
}
