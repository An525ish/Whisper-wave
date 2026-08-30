import type { Server, Socket } from 'socket.io';
import type { LeanUser } from '../types/user.js';

export type {
  SocketNewMessagePayload as NewMessagePayload,
  SocketTypingPayload as TypingPayload,
} from '../validators/socket.js';

export type SocketSession = {
  io: Server;
  socket: Socket;
  userId: string;
  user: LeanUser;
  ghostMode: boolean;
  /** DM partner user IDs — scopes USER_OFFLINE on disconnect. */
  dmPartnerUserIds: string[];
};
