import { useCallback, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { ROOMS_NAMESPACE } from '@/shared/constants/socket';
import { createNamespaceSocket } from '@/shared/lib/socket/createNamespaceSocket';
import { track } from '@/shared/lib/analytics';
import { ROOM_EVENTS } from '../constants';
import { useRoomStore } from '../stores/roomStore';
import { failCopy } from '../utils/roomErrors';
import { bindRoomEvents } from './bindRoomEvents';
import { emitJoin, emitLeave, emitMessage, emitMod, emitReaction } from './roomEmitters';
import type {
  RoomJoinParams,
  RoomMessageAck,
  RoomMessageInput,
  RoomModAction,
  RoomReactionKey,
} from '../types';

const NOT_CONNECTED = { ok: false, code: 'unknown' } as const;

/**
 * Owns the `/rooms` socket for one open room.
 *
 * Mount-bound lifetime: entering the route connects, leaving disconnects. A
 * drop mid-visit is healed in `bindRoomEvents` (the store keeps the join
 * params and the connect handler re-emits `ROOM_JOIN`). Failure toasts for
 * reactions and mod actions live here so screens stay presentational; message
 * sends hand their ack back to the composer, which owns slow-mode, mute and
 * challenge UI.
 */
export function useRoomsSocket(slug: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!slug) return;
    const socket = createNamespaceSocket(ROOMS_NAMESPACE);
    socketRef.current = socket;
    bindRoomEvents(socket, slug);
    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      useRoomStore.getState().reset();
    };
  }, [slug]);

  /** Seat me with this persona. `official` is the only room fact analytics sees. */
  const join = useCallback(
    async (params: RoomJoinParams, official: boolean) => {
      const socket = socketRef.current;
      const store = useRoomStore.getState();
      if (!slug || !socket?.connected) return;
      if (store.joinStatus === 'joining' || store.joinStatus === 'rejoining') return;
      store.beginJoin(params);
      track(ROOM_EVENTS.JOIN, { official });
      const res = await emitJoin(socket, slug, params);
      if (res.ok) return;
      const next = useRoomStore.getState();
      if (res.code === 'feature_off') next.setEnd({ kind: 'switched_off' });
      else if (res.code === 'identity_required') next.setEnd({ kind: 'identity_required' });
      else next.joinFailed(res.code);
    },
    [slug]
  );

  /** Re-knock with the stored persona (after a restart notice). */
  const rejoin = useCallback(
    (official: boolean) => {
      const params = useRoomStore.getState().joinParams;
      if (params) void join(params, official);
    },
    [join]
  );

  const leave = useCallback(() => {
    track(ROOM_EVENTS.LEAVE, {});
    if (socketRef.current) emitLeave(socketRef.current);
  }, []);

  const sendMessage = useCallback(async (input: RoomMessageInput): Promise<RoomMessageAck> => {
    const socket = socketRef.current;
    if (!socket?.connected) return NOT_CONNECTED;
    const res = await emitMessage(socket, input);
    if (res.support) useRoomStore.getState().setSupportNotice();
    if (res.ok) track(ROOM_EVENTS.MESSAGE_SENT, {});
    return res;
  }, []);

  const sendReaction = useCallback(async (messageId: string, reaction: RoomReactionKey) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    const res = await emitReaction(socket, messageId, reaction);
    if (res.ok) useRoomStore.getState().toggleMine(messageId, reaction);
    else toast(failCopy(res.code));
  }, []);

  const sendMod = useCallback(async (action: RoomModAction) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    const res = await emitMod(socket, action);
    if (res.ok) track(ROOM_EVENTS.MOD_ACTION, { action: action.action });
    else toast(failCopy(res.code));
  }, []);

  return { join, rejoin, leave, sendMessage, sendReaction, sendMod };
}
