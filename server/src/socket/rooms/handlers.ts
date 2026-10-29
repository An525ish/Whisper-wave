import type { Namespace } from 'socket.io';
import type { ZodType, z } from 'zod';
import { logger } from '../../utils/logger.js';
import { onSocketEvent } from '../../middlewares/validateSocket.js';
import { isFeatureEnabled } from '../../services/hub.js';
import { roomJoinLimiter } from '../../services/rooms/rateLimit.js';
import {
  ROOM_ERROR,
  ROOM_ERROR_CODES,
  ROOM_JOIN,
  ROOM_LEAVE,
  ROOM_MEDIA_SIGN,
  ROOM_MESSAGE,
  ROOM_MOD,
  ROOM_REACT,
} from '../../constants/room-events.js';
import {
  roomJoinSchema,
  roomLeaveSchema,
  roomMediaSignSchema,
  roomMessageSchema,
  roomModSchema,
  roomReactSchema,
} from '../../validators/rooms.js';
import { handleJoin } from './join.js';
import { handleMediaSign, handleMessage, handleReact } from './messaging.js';
import { handleMod } from './mod.js';
import { releaseSeat, seatKeyOf } from './seats.js';
import { ackCodeOf, ROOM_REJECTIONS } from './wire.js';
import type { RoomSocket } from '../../types/room.js';

type Ack = (res: unknown) => void;
const noAck: Ack = () => undefined;
const ackOf = (rest: unknown[]): Ack => (rest.find((arg) => typeof arg === 'function') as Ack | undefined) ?? noAck;

/** One connected socket: join → chat → leave, plus drop cleanup. */
export const handleRoomConnection = (nsp: Namespace, socket: RoomSocket): void => {
  // Flag enforcement for EVERY event, in one place: when rooms are switched
  // off the packet is dropped here and the sender told why. (Not calling
  // `next` drops it; passing an error would surface as a client `error`.)
  socket.use(([, ...args], next) => {
    if (isFeatureEnabled('rooms')) {
      next();
      return;
    }
    const answer = ackOf(args);
    if (answer === noAck) socket.emit(ROOM_ERROR, { code: ROOM_ERROR_CODES.FEATURE_OFF });
    else answer({ ok: false, code: ROOM_ERROR_CODES.FEATURE_OFF });
  });

  /** Validate → run → ack. A thrown service error becomes `{ ok:false, code }`, never prose. */
  const on = <Schema extends ZodType>(
    event: string,
    schema: Schema,
    work: (data: z.infer<Schema>) => unknown,
    before?: () => boolean
  ): void => {
    onSocketEvent(
      socket,
      event,
      schema,
      async (data, ...rest) => {
        const answer = ackOf(rest);
        try {
          answer(await work(data));
        } catch (err) {
          logger.warn({ err, event }, 'Room event failed');
          answer({ ok: false, code: ackCodeOf(err) });
        }
      },
      { ...(before ? { before } : {}), rejections: ROOM_REJECTIONS }
    );
  };

  on(
    ROOM_JOIN,
    roomJoinSchema,
    async (data) => {
      // Joins serialise per socket: two in flight would race on the seat and the socket room.
      if (socket.roomJoinPending) return { ok: false, code: ROOM_ERROR_CODES.JOIN_IN_PROGRESS };
      socket.roomJoinPending = true;
      try {
        const roomId = await handleJoin(nsp, socket, data);
        // The socket may have dropped mid-join: its seat would otherwise leak.
        if (socket.disconnected) releaseSeat(nsp, socket, roomId);
        return { ok: true, roomId };
      } catch (err) {
        const code = ackCodeOf(err);
        if (code === 'unknown') logger.warn({ err }, 'Room join failed');
        socket.emit(ROOM_ERROR, { code });
        return { ok: false, code };
      } finally {
        socket.roomJoinPending = false;
      }
    },
    () => roomJoinLimiter.allow(seatKeyOf(socket))
  );

  on(ROOM_MESSAGE, roomMessageSchema, (data) => handleMessage(nsp, socket, data));
  on(ROOM_MEDIA_SIGN, roomMediaSignSchema, (data) => handleMediaSign(socket, data));
  on(ROOM_REACT, roomReactSchema, (data) => handleReact(nsp, socket, data));
  on(ROOM_MOD, roomModSchema, (data) => handleMod(nsp, socket, data));

  on(ROOM_LEAVE, roomLeaveSchema, () => {
    if (socket.roomInstanceId) releaseSeat(nsp, socket, socket.roomInstanceId);
    return { ok: true };
  });

  socket.on('disconnect', () => {
    if (socket.roomInstanceId) releaseSeat(nsp, socket, socket.roomInstanceId);
  });
};
