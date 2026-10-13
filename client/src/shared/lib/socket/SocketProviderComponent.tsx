import { BASE_URL } from '@/shared/constants/app';
import { useEffect, useMemo, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from './socketContext';

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
