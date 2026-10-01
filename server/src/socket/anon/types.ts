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
  /**
   * Signed-in account behind this socket, when the `accessToken` cookie
   * verified. Absent for every guest — anonymous stays fully anonymous, and a
   * missing, malformed or unknown token all yield a working anon session.
   */
  userId?: string;
};
