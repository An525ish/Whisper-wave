import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';

/**
 * The app-wide socket. Lives in its own module (not in `SocketProvider.tsx`)
 * so that file only exports components, which is what fast refresh requires.
 */
export const SocketContext = createContext<Socket | null>(null);

export function useSocket(): Socket {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return socket;
}
