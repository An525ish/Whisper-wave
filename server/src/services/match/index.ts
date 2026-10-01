/**
 * Barrel for the `match` service domain.
 *
 * Explicit named re-exports (not `export *`) so a same-named export in two
 * modules collides at compile time instead of silently shadowing, and so the
 * internal Redis key/TTL module is not part of the public surface.
 */

export {
  saveWaitingCard,
  getWaitingCard,
  touchWaitingCard,
  deleteWaitingCard,
  enqueue,
  reenqueue,
  dequeue,
  queueSize,
  tryMatchFromQueue,
  vibePairScore,
  generateSessionId,
} from './queue.js';

export {
  createSession,
  getSession,
  getActiveSessionId,
  touchSession,
  isParticipant,
  getPartner,
  endSession,
  deleteSession,
  bufferMessage,
  getBufferedMessages,
} from './session.js';

export { recordLike } from './like.js';
export { joinQueue, leaveQueue } from './queueEntry.js';
export { blockAnonId, isBlocked, isBlockedEitherWay } from './block.js';
export { issueConnectToken, verifyConnectToken } from './connectToken.js';
export { isVibeUnlocked, meetsVibeGate, VIBE_UNLOCK } from './vibeEligibility.js';
export {
  clearPresence,
  handleSocketDrop,
  endSessionNow,
  stopAllPresenceSweeps,
} from './presence.js';
export { pairOrEnqueue, requireActiveParticipant } from './pairing.js';
export {
  acceptAnonMessage,
  relayMessage,
  notifyMatchEnded,
} from './messaging.js';
export {
  inspectMessage,
  shouldAutoReport,
  rejectionMessage,
} from './moderation.js';
