import type { Namespace } from 'socket.io';
import { MATCH_FOUND } from '../../constants/anon-events.js';
import {
  getBufferedMessages,
  getSessionReactions,
  isParticipant,
  toWireMessage,
} from '../../services/match/index.js';
import type { AnonSession, WaitingCard } from '../../types/match.js';
import type { AnonSocket } from '../../types/anonSocket.js';

/** Notify both anonymous users and attach sessionId to their /anon sockets. */
export const emitMatchFound = async (
  nsp: Namespace,
  sessionId: string,
  localAnonId: string,
  partnerAnonId: string,
  localCard: WaitingCard,
  partnerCard: WaitingCard,
  createdAt: number
): Promise<void> => {
  // Attach `sessionId` to both sides' sockets BEFORE telling either of them the
  // match exists.
  //
  // This used to run after the emits, which is a race the client cannot lose: the
  // moment a socket receives MATCH_FOUND it may act on it, and every handler here
  // (ANON_NEXT especially) reads `socket.sessionId` to decide who to notify. In
  // the old order a skip arriving in that window read `undefined`, skipped the
  // teardown entirely, and left the partner sitting in a chat that no longer
  // existed. It also meant a socket joining the room between the two statements
  // got the event without ever getting the id.
  //
  // `fetchSockets()` is a round trip, so awaiting it first is what actually makes
  // the ordering a guarantee rather than a hope.
  for (const anonId of [localAnonId, partnerAnonId]) {
    const sockets = await nsp.in(`anon:${anonId}`).fetchSockets();
    for (const socket of sockets) {
      (socket as unknown as AnonSocket).sessionId = sessionId;
    }
  }

  // A brand-new session has no history, so there is nothing to replay.
  nsp.to(`anon:${localAnonId}`).emit(MATCH_FOUND, {
    sessionId,
    createdAt,
    partner: {
      displayName: partnerCard.displayName,
      vibeTags: partnerCard.vibeTags,
    },
    bufferedMessages: [],
  });

  nsp.to(`anon:${partnerAnonId}`).emit(MATCH_FOUND, {
    sessionId,
    createdAt,
    partner: {
      displayName: localCard.displayName,
      vibeTags: localCard.vibeTags,
    },
    bufferedMessages: [],
  });
};

/** Late socket connect after a match — replay MATCH_FOUND to one client. */
export const emitMatchFoundToSocket = async (
  socket: AnonSocket,
  anonId: string,
  session: AnonSession
): Promise<void> => {
  if (!isParticipant(session, anonId)) return;

  const isAnon1 = session.anon1 === anonId;
  const partnerName = isAnon1 ? session.name2 : session.name1;
  const partnerTags = isAnon1 ? session.tags2 : session.tags1;
  // The buffer stores the sender's anonId; the client gets `me` / `them` computed
  // for THIS recipient, and reactions keyed the same way — never an anonId.
  const stored = await getBufferedMessages(session.sessionId);
  const bufferedMessages = stored.map((message) => toWireMessage(message, anonId));
  const reactions = await getSessionReactions(session.sessionId, stored, anonId);

  socket.sessionId = session.sessionId;
  socket.emit(MATCH_FOUND, {
    sessionId: session.sessionId,
    // The thread's REAL start time, not now. Without it a resumed session resets
    // the client's clock and a conversation that has been going an hour reports
    // itself as "just met" — which also makes the 24 h expiry countdown lie.
    createdAt: session.createdAt,
    partner: { displayName: partnerName, vibeTags: partnerTags },
    bufferedMessages,
    reactions,
  });
};
