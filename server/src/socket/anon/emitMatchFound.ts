import type { Namespace } from 'socket.io';
import { MATCH_FOUND } from '../../constants/anon-events.js';
import { getBufferedMessages, isParticipant } from '../../services/match/index.js';
import type { AnonSession, WaitingCard } from '../../types/match.js';
import type { AnonSocket } from './types.js';

/** Notify both anonymous users and attach sessionId to their /anon sockets. */
export const emitMatchFound = async (
  nsp: Namespace,
  sessionId: string,
  localAnonId: string,
  partnerAnonId: string,
  localCard: WaitingCard,
  partnerCard: WaitingCard
): Promise<void> => {
  // A brand-new session has no history, so there is nothing to replay.
  nsp.to(`anon:${localAnonId}`).emit(MATCH_FOUND, {
    sessionId,
    partner: {
      displayName: partnerCard.displayName,
      vibeTags: partnerCard.vibeTags,
    },
    bufferedMessages: [],
  });

  nsp.to(`anon:${partnerAnonId}`).emit(MATCH_FOUND, {
    sessionId,
    partner: {
      displayName: localCard.displayName,
      vibeTags: localCard.vibeTags,
    },
    bufferedMessages: [],
  });

  for (const anonId of [localAnonId, partnerAnonId]) {
    const sockets = await nsp.in(`anon:${anonId}`).fetchSockets();
    for (const socket of sockets) {
      (socket as unknown as AnonSocket).sessionId = sessionId;
    }
  }
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
  const bufferedMessages = await getBufferedMessages(session.sessionId);

  socket.sessionId = session.sessionId;
  socket.emit(MATCH_FOUND, {
    sessionId: session.sessionId,
    partner: { displayName: partnerName, vibeTags: partnerTags },
    bufferedMessages,
  });
};
