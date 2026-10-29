import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';
import { BASE_URL } from '@/shared/constants/app';

const RECONNECT_DELAY_MS = 800;
const RECONNECT_DELAY_MAX_MS = 5_000;
const CONNECT_TIMEOUT_MS = 20_000;

/**
 * A credentialed, websocket-only socket on one namespace, not yet connected
 * (`autoConnect: false` so React Strict Mode double-invoke never leaves a
 * dangling connection — the caller connects and pairs it with a disconnect).
 * Reconnects forever with a capped backoff; `options` override the defaults.
 */
export function createNamespaceSocket(
  namespace: string,
  options: Partial<ManagerOptions & SocketOptions> = {}
): Socket {
  return io(`${BASE_URL}${namespace}`, {
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: RECONNECT_DELAY_MS,
    reconnectionDelayMax: RECONNECT_DELAY_MAX_MS,
    timeout: CONNECT_TIMEOUT_MS,
    ...options,
  });
}
