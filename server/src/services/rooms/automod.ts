import { inspectMessage } from '../match/moderation.js';
import type { RoomMessageCheck, RoomModVerdict } from '../../types/room.js';

/** Explicit links. Guests and new members may never post them, full stop. */
const LINK_RE = /(https?:\/\/|www\.)[^\s]+|[^\s]+\.(com|net|org|io|app|dev|in|co|xyz|link|lol|me)\b/i;

/** Shouting (10+ letters, mostly caps) and emoji floods. */
const capsShout = (text: string): boolean => {
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length < 10) return false;
  const caps = letters.replace(/[^A-Z]/g, '').length;
  return caps / letters.length > 0.7;
};

const emojiFlood = (text: string): boolean => {
  const emojis = text.match(/\p{Extended_Pictographic}/gu) ?? [];
  return emojis.length > 8;
};

/**
 * Self-harm language — handled OUTSIDE the block verdict.
 *
 * A cry for help must never be auto-banned, auto-reported or silently eaten:
 * the message flows (or refuses) exactly as it otherwise would, and the
 * caller additionally shows the sender a resources card. Deliberately narrow
 * English patterns; gaming slang ("this level is suicide") can false-positive,
 * and a dismissible supportive card is the safe failure mode.
 */
const SELF_HARM_RES = [
  /\bkill(ing)?\s+myself\b/i,
  /\bsuicid(e|al)\b/i,
  /\bself[\s-]?harm\b/i,
  /\bend\s+my\s+life\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bbetter\s+off\s+dead\b/i,
];

export const showsSelfHarmSigns = (text: string): boolean =>
  SELF_HARM_RES.some((re) => re.test(text));

/**
 * All-rooms automod ($0, in-process). Order matters: slow mode first (cheapest,
 * no content inspected), then the shared word list (severe hits name themselves
 * for auto-report), then links, duplicates and floods.
 *
 * Fails open only where the word list does (its own catch). Every other check
 * is total string matching — nothing to throw.
 */
export const checkRoomMessage = (input: RoomMessageCheck): RoomModVerdict => {
  const { text, slowModeMs, msSinceLastPost, recentTexts } = input;

  if (msSinceLastPost !== undefined && msSinceLastPost < slowModeMs) {
    return {
      allowed: false,
      code: 'slow_mode',
      retryAfterMs: slowModeMs - msSinceLastPost,
    };
  }

  const verdict = inspectMessage(text);
  if (!verdict.allowed) {
    return { allowed: false, code: 'blocked_content', severe: verdict.severe };
  }

  if (!input.linksAllowed && LINK_RE.test(text)) {
    return { allowed: false, code: 'blocked_link' };
  }

  const normalized = text.trim().toLowerCase();
  if (normalized.length > 0 && recentTexts.slice(-3).some((t) => t.trim().toLowerCase() === normalized)) {
    return { allowed: false, code: 'duplicate' };
  }

  if (capsShout(text) || emojiFlood(text)) {
    return { allowed: false, code: 'spam' };
  }

  return { allowed: true };
};
