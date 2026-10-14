import { inspectMessage } from '../match/moderation.js';
import { ROOM_MAX_LINES } from '../../constants/rooms.js';
import type { RoomMessageCheck, RoomModVerdict } from '../../types/room.js';

/**
 * Text normalisation for scanning: NFKC (fullwidth letters/dots fold to ASCII),
 * zero-width and other format characters removed (they split words and hosts
 * invisibly), ideographic full stops read as dots.
 */
export const normalizeForScan = (text: string): string =>
  text
    .normalize('NFKC')
    .replace(/\p{Cf}/gu, '')
    .replace(/[。｡․‧﹒]/g, '.');

/** A host-looking token (`label.label.tld`) or an IPv4. Deliberately broad: guests post no links. */
const HOST_RE = /(?:[a-z0-9][a-z0-9-]*\.)+[a-z]{2,}(?![a-z0-9-])|\b\d{1,3}(?:\.\d{1,3}){3}\b/i;
const SCHEME_RE = /(?:https?:\/\/|www\.|ftp:\/\/)\S+/i;
/** "example (dot) com" / "example[.]com" style evasions. */
const SPELLED_DOT_RE = /[a-z0-9]\s*[[(]\s*(?:\.|dot)\s*[\])]\s*[a-z]/i;
/** Shorteners and invite hosts — also matched with spaces removed ("t . me/x"). */
const LINK_HOSTS = [
  'discord.gg', 'discord.com/invite', 't.me', 'telegram.me', 'bit.ly', 'tinyurl.com',
  'wa.me', 'linktr.ee', 'goo.gl', 'is.gd', 'cutt.ly', 'rb.gy', 'youtu.be', 'snapchat.com/add',
];
const HOST_LIST_RE = new RegExp(
  `(?:^|[^a-z0-9])(?:${LINK_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|')})`,
  'i'
);

/** Whether the text carries anything that reads as a link. */
export const containsLink = (text: string): boolean => {
  const t = normalizeForScan(text);
  return (
    SCHEME_RE.test(t) ||
    HOST_RE.test(t) ||
    SPELLED_DOT_RE.test(t) ||
    HOST_LIST_RE.test(t.replace(/\s+/g, ''))
  );
};

/** `@name` — a ping at someone in the room. */
const MENTION_RE = /(?:^|\s)@\S/u;

const lineCount = (text: string): number => text.split(/\r\n|\r|\n/).length;

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
  const { text, msSinceLastPost, recentTexts, strict } = input;
  const slowModeMs = strict ? Math.max(input.slowModeMs, strict.slowModeMinMs) : input.slowModeMs;

  if (msSinceLastPost !== undefined && msSinceLastPost < slowModeMs) {
    return {
      allowed: false,
      code: 'slow_mode',
      retryAfterMs: slowModeMs - msSinceLastPost,
    };
  }

  const verdict = inspectMessage(normalizeForScan(text));
  if (!verdict.allowed) {
    return { allowed: false, code: 'blocked_content', severe: verdict.severe, category: verdict.reason };
  }

  if (lineCount(text) > ROOM_MAX_LINES) return { allowed: false, code: 'spam' };

  if (strict && (text.length > strict.maxLength || (strict.blockMentions && MENTION_RE.test(text)))) {
    return { allowed: false, code: 'spam' };
  }

  if (!input.linksAllowed && containsLink(text)) {
    return { allowed: false, code: 'blocked_link' };
  }

  const normalized = text.trim().toLowerCase();
  if (normalized.length > 0 && recentTexts.slice(-(strict?.duplicateWindow ?? 3)).some((t) => t.trim().toLowerCase() === normalized)) {
    return { allowed: false, code: 'duplicate' };
  }

  if (capsShout(text) || emojiFlood(text)) {
    return { allowed: false, code: 'spam' };
  }

  return { allowed: true };
};

/**
 * Screen free text (room titles, descriptions, aliases): word list + links.
 * Used by the lobby for user-created rooms.
 */
export const screenText = (text: string): { ok: boolean; reason?: string } => {
  if (!inspectMessage(normalizeForScan(text)).allowed) return { ok: false, reason: 'blocked_content' };
  if (containsLink(text)) return { ok: false, reason: 'blocked_link' };
  return { ok: true };
};

/** Canonical display form of an alias: NFKC, no invisible characters, single spaces. */
export const normalizeAlias = (alias: string): string =>
  normalizeForScan(alias).replace(/\s+/g, ' ').trim();

/** Uniqueness key: two aliases that differ only by case or width are the same person-slot. */
export const aliasKey = (alias: string): string => normalizeAlias(alias).toLowerCase();

/** Staff words — banned as whole words ("Modesty" and "Admiral" are fine). */
const RESERVED_WORDS = new Set(['admin', 'administrator', 'moderator', 'mod', 'staff']);
/** Names only the bot/team may wear — banned when the WHOLE alias is one of these (spaces ignored). */
const RESERVED_EXACT = new Set(['wave', 'whisper', 'system', 'host']);

/**
 * Alias gate: reserved words (also joined, "w a v e team"), the word list, and
 * link-shaped names. Whole-word matching so "Modesty" and "Admiral" pass.
 */
export const screenAlias = (alias: string): { ok: boolean; reason?: string } => {
  const key = aliasKey(alias);
  if (key.length === 0) return { ok: false, reason: 'alias_invalid' };
  const words = key.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const joined = words.join('');
  if (words.some((w) => RESERVED_WORDS.has(w)) || joined.includes('waveteam') || RESERVED_EXACT.has(joined)) {
    return { ok: false, reason: 'alias_invalid' };
  }
  return screenText(key);
};
