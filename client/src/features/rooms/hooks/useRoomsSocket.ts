import { useCallback, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { BASE_URL } from '@/shared/constants/app';
import { SOCKET_LIFECYCLE } from '@/shared/constants/socket';
import { track } from '@/shared/lib/analytics';
import { ROOM_EVENTS, ROOM_FAIL_COPY, ROOM_IN, ROOM_OUT } from '../constants';
import { useRoomStore } from '../stores/roomStore';
import type { RoomMessage, RoomYou } from '../types';

type StatePayload = {
  roomId: string;
  instance: number;
  slug: string;
  title: string;
  rules: string[];
  recent: RoomMessage[];
  online: number;
  you: RoomYou;
};

type ModAction = {
  action: 'delete' | 'mute' | 'kick' | 'muted' | 'kicked' | 'locked' | 'unlocked' | 'slow';
  messageId?: string;
  minutes?: number;
  ms?: number;
  targetAlias?: string;
};

type AckResult = { ok: boolean; code?: string; retryAfterMs?: number; support?: boolean } | undefined;

const newMessageId = (): string => {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return c.randomUUID();
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const failCopy = (code: unknown): string =>
  ROOM_FAIL_COPY[typeof code === 'string' ? code : ''] ?? ROOM_FAIL_COPY.unknown;

/**
 * Owns the `/rooms` socket for one open room.
 *
 * Mount-bound lifetime: entering the route connects, leaving disconnects
 * (rooms rejoin cleanly, unlike whispers — no session to preserve). All
 * failure toasts live here so screens stay presentational.
 */
export function useRoomsSocket(slug: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!slug) return;
    const store = useRoomStore.getState;

    const socket: Socket = io(`${BASE_URL}/rooms`, {
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

    socket.on(SOCKET_LIFECYCLE.CONNECT, () => store().setSocketConnected(true));
    socket.on(SOCKET_LIFECYCLE.DISCONNECT, () => store().setSocketConnected(false));
    socket.on(SOCKET_LIFECYCLE.CONNECT_ERROR, (err: Error) => {
      store().setSocketConnected(false);
      if (/Room identity required/i.test(err.message)) {
        store().setError('banned');
      }
    });

    socket.on(ROOM_IN.STATE, (state: StatePayload) => {
      store().applyState({
        instanceId: state.roomId,
        slug: state.slug,
        title: state.title,
        rules: state.rules,
        messages: state.recent,
        online: state.online,
        you: state.you,
      });
    });
    socket.on(ROOM_IN.MESSAGE, (message: RoomMessage) => {
      store().appendMessage(message);
    });
    socket.on(ROOM_IN.PRESENCE, (payload: { online: number }) => {
      store().setPresence(payload.online ?? 0);
    });
    socket.on(
      ROOM_IN.REACTION,
      (payload: { messageId: string; reaction: string; count: number }) => {
        store().applyReaction(payload.messageId, payload.reaction, payload.count);
      }
    );
    socket.on(ROOM_IN.MOD_ACTION, (action: ModAction) => {
      if (action.action === 'delete' && action.messageId) {
        store().removeMessage(action.messageId);
      } else if (action.action === 'kicked') {
        store().setKicked();
      } else if (action.action === 'muted') {
        toast(`You were muted${action.minutes ? ` for ${action.minutes} min` : ''}.`);
      } else if (action.action === 'locked') {
        toast('This room is locked — no new joins for now.');
      } else if (action.action === 'unlocked') {
        toast('This room is open again.');
      } else if (action.action === 'slow') {
        toast(
          typeof action.ms === 'number' && action.ms > 0
            ? `Slow mode: one message per ${Math.round(action.ms / 1000)}s.`
            : 'Slow mode off.'
        );
      }
    });
    socket.on(ROOM_IN.CLOSED, (payload: { reason: string }) => {
      store().setClosed(payload.reason || 'This room is closed right now.');
    });
    socket.on(ROOM_IN.ERROR, (payload: { code: string }) => {
      store().setError(payload.code || 'unknown');
      toast(failCopy(payload.code));
    });

    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      store().reset();
    };
  }, [slug]);

  const join = useCallback((params: { alias: string; color?: string; invite?: string }) => {
    track(ROOM_EVENTS.JOIN, { slug: slug ?? '' });
    socketRef.current?.emit(ROOM_OUT.JOIN, { slug, ...params });
  }, [slug]);

  const leave = useCallback(() => {
    track(ROOM_EVENTS.LEAVE, { slug: slug ?? '' });
    socketRef.current?.emit(ROOM_OUT.LEAVE, {});
  }, [slug]);

  const sendMessage = useCallback(
    (text: string, opts?: { id?: string; replyTo?: string }) => {
      const socket = socketRef.current;
      const trimmed = text.trim();
      if (!socket?.connected || !trimmed) return;
      const id = opts?.id ?? newMessageId();
      socket.emit(
        ROOM_OUT.MESSAGE,
        { id, text: trimmed, ...(opts?.replyTo ? { replyTo: opts.replyTo } : {}) },
        (res: AckResult) => {
          if (res?.support) useRoomStore.getState().setSupportNotice();
          if (res?.ok) {
            track(ROOM_EVENTS.MESSAGE_SENT, {});
            return;
          }
          toast(failCopy(res?.code));
        }
      );
    },
    []
  );

  const sendReaction = useCallback((messageId: string, reaction: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit(ROOM_OUT.REACT, { messageId, reaction }, (res: { ok: boolean; code?: string } | undefined) => {
      if (!res?.ok) toast(failCopy(res?.code));
    });
  }, []);

  const sendMod = useCallback(
    (action: { action: 'delete' | 'mute' | 'kick' | 'lock' | 'unlock' | 'slow' | 'shadowmute'; messageId?: string; target?: string; minutes?: number; ms?: number }) => {
      const socket = socketRef.current;
      if (!socket?.connected) return;
      socket.emit(ROOM_OUT.MOD, action, (res: AckResult) => {
        if (res?.ok) {
          track(ROOM_EVENTS.MOD_ACTION, { action: action.action });
          return;
        }
        toast(failCopy(res?.code));
      });
    },
    []
  );

  return { join, leave, sendMessage, sendReaction, sendMod };
}
