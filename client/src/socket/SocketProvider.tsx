import { BASE_URL } from '@/constants/app';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useMemo(
    () => io(BASE_URL, { withCredentials: true, autoConnect: false }),
    [],
  );

  useEffect(() => {
    // Connect here so the lifecycle is always paired with a cleanup disconnect.
    // autoConnect: false prevents a dangling connect in React 19 Strict Mode double-invoke.
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): Socket {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return socket;
}
