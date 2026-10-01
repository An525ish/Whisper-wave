import type { Socket } from 'socket.io';

/**
 * Extended Socket type for the /anon namespace.
 * `anonId` is set by the auth middleware on connect; `sessionId` is attached
 * once a match is created (or replayed on a reconnect).
 */
export type AnonSocket = Socket & {
  anonId: string;
  /** sessionId of the active match, if one exists. Set after MATCH_FOUND. */
  sessionId?: string;
};
