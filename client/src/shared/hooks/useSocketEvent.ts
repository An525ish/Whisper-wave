import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

/** Socket.IO listener; args are narrowed by each event handler. */
type SocketEventHandler = (...args: unknown[]) => void;

type SocketEventMap = Record<string, SocketEventHandler>;

const useSocketEvent = (socket: Socket, events: SocketEventMap): void => {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const wrappers = Object.keys(eventsRef.current).map((event) => {
      const wrapper: SocketEventHandler = (...args) => {
        eventsRef.current[event]?.(...args);
      };
      socket.on(event, wrapper);
      return [event, wrapper] as const;
    });

    return () => {
      for (const [event, wrapper] of wrappers) {
        socket.off(event, wrapper);
      }
    };
  }, [socket]);
};

export default useSocketEvent;
