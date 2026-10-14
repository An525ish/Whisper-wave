import { ROOM_LIMITS } from '../constants';

/**
 * Normalise what the guest typed for the first-post challenge ("7 + 4"): the
 * server compares a short string, so keep digits and an optional leading minus,
 * drop spaces, and refuse anything else. Null = not an answer yet.
 */
export const parseChallengeAnswer = (raw: string): string | null => {
  const compact = raw.replace(/\s+/g, '');
  if (!/^-?\d+$/.test(compact)) return null;
  const normalised = compact.replace(/^(-?)0+(?=\d)/, '$1');
  return normalised.length <= ROOM_LIMITS.CHALLENGE_ANSWER_MAX ? normalised : null;
};
