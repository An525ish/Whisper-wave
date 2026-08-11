import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';

/** Socket.IO listener; args are narrowed by each event handler. */
type SocketEventHandler = (...args: unknown[]) => void;

type SocketEventMap = Record<string, SocketEventHandler>;

const useSocketEvent = (socket: Socket, events: SocketEventMap): void => {
  useEffect(() => {
    Object.entries(events).forEach(([event, handler]) => {
      // Socket.IO types listeners as `(...args: any[]) => void`
      socket.on(event, handler as (...args: unknown[]) => void);
    });
    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler as (...args: unknown[]) => void);
      });
    };
  }, [socket, events]);
};

export default useSocketEvent;
