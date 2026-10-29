import type { RoomMessageInput } from '../types';

/** First-post challenge from a `challenge_required` ack: Turnstile (site key) or the dev arithmetic fallback. */
export type RoomChallenge =
  | { provider: 'turnstile'; siteKey: string }
  | { provider: 'arithmetic'; token: string; prompt: string };

/** What the re-sent message carries back. */
export type RoomChallengeAnswer =
  | { provider: 'turnstile'; token: string }
  | { provider?: 'arithmetic'; token: string; answer: string };

/** Ack codes that put (or keep) the challenge modal up. */
export type RoomChallengeCode = 'challenge_required' | 'challenge_failed' | 'challenge_unavailable';

/** A message held while the guest clears the first-post check. `nonce` bumps per challenge so the widget remounts fresh. */
export type RoomPendingChallenge = {
  input: RoomMessageInput;
  challenge: RoomChallenge;
  code: RoomChallengeCode;
  nonce: number;
  /** The server accepted the check and the message is out; the modal plays its success beat, then closes. */
  passed: boolean;
};
