import { logger } from '../../utils/logger.js';
import type { MessageVerdict, ModerationReason } from '../../types/match.js';

/**
 * First-line text moderation for anonymous messages.
 *
 * This is NOT a toxicity classifier (that's Perspective API, Phase 3). It's a
 * deliberately small, auditable, zero-cost list of unambiguous slurs, sexual
 * terms, and contact-scam patterns that must never be broadcast to another
 * stranger on first contact. It also normalises the leetspeak/homoglyph tricks
 * that are trivially used to slip past a naive filter.
 *
 * Matching is on WORD BOUNDARIES, never plain substrings: a substring match flags
 * "grape", "scrape", "therapeutic" (rape), "torpedo", "pedometer" (pedo) and
 * blocks ordinary conversation. Obfuscation is handled by normalising FIRST
 * (leetspeak folded, separators collapsed, spaced-out letters joined) and then
 * boundary-matching the normalised text, so "p0rn" and "s-e-x chat" still match
 * while "grape" does not. A term that should also match its inflections lists
 * them explicitly ("rape", "raped", "raping") — there is no stemming.
 *
 * Design rules:
 *  - We fail OPEN: if the filter itself errors we let the message through, and
 *    we log loudly. A moderation outage must not make the product unusable —
 *    but it must not be silent either.
 *  - We never echo the offending text back to the sender, and we never tell the
 *    recipient who triggered it.
 *  - `severe` categories (CSAM-adjacent, violence threats) are the ONLY ones that
 *    auto-file a report and block the pair. Everything else is just not delivered.
 *    Every term in a severe category is by construction also blocked.
 */

type Category = {
  reason: ModerationReason;
  /** Auto-report the sender and mutually block the pair. */
  severe: boolean;
  terms: readonly string[];
};

const CATEGORIES: readonly Category[] = [
  {
    reason: 'sexual',
    severe: false,
    terms: [
      'nudes', 'nude pic', 'send nudes', 'sex chat', 'blowjob', 'dick pic',
      'porn', 'porno', 'pornhub', 'pornography', 'hentai', 'onlyfans',
      'camgirl', 'sexting', 'fuck me', 'sit on my face',
    ],
  },
  {
    // CSAM-adjacent: blocked AND reported.
    reason: 'sexual',
    severe: true,
    terms: [
      'loli', 'shota', 'child porn', 'underage nude', 'minor sex',
      'pedo', 'pedos', 'pedophile', 'pedophiles', 'pedophilia', 'paedophile',
    ],
  },
  {
    reason: 'solicitation',
    severe: false,
    terms: [
      'whatsapp', 'telegram', 'snapchat', 'add me on', 'my number is',
      'text me at', 'crypto', 'btc', 'usdt', 'binance', 'gift card',
      'wire transfer', 'western union', 'moneygram', 'send money',
      'bank account', 'credit card', 'investment opportunity', 'paysafe',
    ],
  },
  {
    // Telling someone to harm themselves, or self-harm statements. Blocked, but
    // not auto-reported: "i want to die" is a person who needs support, not a
    // case for a moderation queue.
    reason: 'violence',
    severe: false,
    terms: ['kill yourself', 'kys', 'i want to die', 'end my life', 'raped', 'rapist'],
  },
  {
    reason: 'violence',
    severe: true,
    terms: ['how to make a bomb', 'rape', 'raping'],
  },
];

/** One boundary-anchored regex per category, built once. */
const MATCHERS = CATEGORIES.map(({ reason, severe, terms }) => ({
  reason,
  severe,
  // Not preceded or followed by a letter/digit, so a term only matches as a whole
  // word / phrase. Spaces inside a phrase match any run of whitespace.
  pattern: new RegExp(
    `(?<![a-z0-9])(?:${terms.map((t) => t.replace(/ /g, '\\s+')).join('|')})(?![a-z0-9])`
  ),
}));

const LEET: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's',
};

const isLetter = (c: string | undefined): boolean => c !== undefined && /[a-z]/.test(c);

/** Cheap obfuscation normalisation: leetspeak, separators, spaced-out letters. */
const normalize = (input: string): string => {
  let out = input.toLowerCase();

  // Fold leetspeak digits/symbols back to letters — but only when touching a
  // letter, so a plain number ("100") or sentence punctuation is left alone and
  // "p0rn" becomes "porn". `!` and `|` stand in for "i" only INSIDE a word
  // ("n!ce"); a trailing "!" is just punctuation and must not glue onto a term.
  out = out.replace(/[013457@$!|]/g, (c, offset: number, str: string) => {
    const prev = str[offset - 1];
    const next = str[offset + 1];
    if (c === '!' || c === '|') return isLetter(prev) && isLetter(next) ? 'i' : c;
    return isLetter(prev) || isLetter(next) ? (LEET[c] ?? c) : c;
  });

  // Collapse separator soup so "s-e-x" and "s.e.x" both read as "s e x".
  out = out.replace(/[\s._*+~^/\\-]+/g, ' ');

  // Join letters split by separators: "s e x c h a t" -> "sexchat". Requires a run
  // of at least THREE single letters so ordinary text like "plan b i guess" is not
  // glued together.
  out = out.replace(/(?<![a-z0-9])(?:[a-z] ){2,}[a-z](?![a-z0-9])/g, (run) =>
    run.replace(/ /g, '')
  );

  return out;
};

/**
 * Inspect an outbound anonymous message. Never throws — a filter fault
 * degrades to "allowed" and is logged.
 *
 * The severest matching category wins, so a message that trips both a severe and
 * a non-severe term is reported as severe.
 */
export const inspectMessage = (content: string): MessageVerdict => {
  try {
    const normalized = normalize(content);

    let hit: { reason: ModerationReason; severe: boolean } | null = null;
    for (const { reason, severe, pattern } of MATCHERS) {
      if (!pattern.test(normalized)) continue;
      if (severe) return { allowed: false, reason, severe: true };
      hit ??= { reason, severe: false };
    }
    return hit ? { allowed: false, ...hit } : { allowed: true };
  } catch (err) {
    logger.error({ err }, 'Moderation filter fault — failing OPEN');
    return { allowed: true };
  }
};

/** Client-facing copy. Intentionally vague and non-accusatory. */
export const rejectionMessage = (): string =>
  "That message can't be sent in a Whisper chat. Keep it respectful.";
