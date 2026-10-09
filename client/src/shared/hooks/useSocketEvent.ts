import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

/** Socket.IO listener; args are narrowed by each event handler. */
type SocketEventHandler = (...args: unknown[]) => void;

type SocketEventMap = Record<string, SocketEventHandler>;

const useSocketEvent = (socket: Socket, events: SocketEventMap): void => {
  const eventsRef = useRef(events);

  // Refreshed in an effect (never during render) so the subscription below is
  // registered once per socket: callers routinely pass a fresh `events` object
  // every render and must not re-register listeners for it.
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

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
