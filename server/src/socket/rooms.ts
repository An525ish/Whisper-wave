import type { Server, Socket } from 'socket.io';
import { chatRoom } from '../utils/helper.js';
import { getMemberSockets } from '../services/presence/index.js';

/** Join one socket to every chat the user belongs to (call on connect). */
export const joinSocketToChatRooms = async (
  socket: Socket,
  joinedChats: Array<{ _id: { toString(): string } }>
): Promise<void> => {
  await Promise.all(
    joinedChats.map((chat) => socket.join(chatRoom(String(chat._id))))
  );
};

/** Join already-connected sockets when someone is added to a chat mid-session. */
export const joinUsersToChatRoom = async (
  io: Server,
  chatId: string,
  userIds: Array<string | { toString(): string }>
): Promise<void> => {
  const room = chatRoom(chatId);
  for (const socketId of getMemberSockets(userIds)) {
    await io.sockets.sockets.get(socketId)?.join(room);
  }
};

export const leaveUsersFromChatRoom = async (
  io: Server,
  chatId: string,
  userIds: Array<string | { toString(): string }>
): Promise<void> => {
  const room = chatRoom(chatId);
  for (const socketId of getMemberSockets(userIds)) {
    void io.sockets.sockets.get(socketId)?.leave(room);
  }
};
