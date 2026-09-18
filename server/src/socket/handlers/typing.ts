import { START_TYPING, STOP_TYPING } from '../../constants/socket-events.js';
import { onSocketEvent } from '../../middlewares/index.js';
import { chatRoom } from '../../utils/helper.js';
import { socketTypingSchema } from '../../validators/socket.js';
import type { SocketSession } from '../types.js';

const emitTyping = (
  session: SocketSession,
  event: typeof START_TYPING | typeof STOP_TYPING,
  chatId: string
): void => {
  const { socket, ghostMode } = session;
  if (ghostMode) return;

  socket.broadcast.to(chatRoom(chatId)).emit(event, { chatId });
};

export const registerTypingHandlers = (session: SocketSession): void => {
  const { socket } = session;

  onSocketEvent(socket, START_TYPING, socketTypingSchema, ({ chatId }) => {
    emitTyping(session, START_TYPING, chatId);
  });

  onSocketEvent(socket, STOP_TYPING, socketTypingSchema, ({ chatId }) => {
    emitTyping(session, STOP_TYPING, chatId);
  });
};
