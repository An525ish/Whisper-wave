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
 * Design rules:
 *  - We fail OPEN: if the filter itself errors we let the message through, and
 *    we log loudly. A moderation outage must not make the product unusable —
 *    but it must not be silent either.
 *  - We never echo the offending text back to the sender, and we never tell the
 *    recipient who triggered it.
 */

type Category = {
  reason: ModerationReason;
  terms: readonly string[];
};

const CATEGORIES: readonly Category[] = [
  {
    reason: 'sexual',
    terms: [
      'nudes', 'nude pic', 'send nudes', 'sex chat', 'blowjob', 'dick pic',
      'porn', 'hentai', 'onlyfans', 'camgirl', 'sexting', 'fuck me',
      'sit on my face', 'loli', 'shota', 'child porn', 'underage nude',
      'minor sex',
    ],
  },
  {
    reason: 'solicitation',
    terms: [
      'whatsapp', 'telegram', 'snapchat', 'add me on', 'my number is',
      'text me at', 'crypto', 'btc', 'usdt', 'binance', 'gift card',
      'wire transfer', 'western union', 'moneygram', 'send money',
      'bank account', 'credit card', 'investment opportunity', 'paysafe',
    ],
  },
  {
    reason: 'violence',
    terms: [
      'kill yourself', 'kys', 'i want to die', 'end my life',
      'how to make a bomb', 'rape', 'raping',
    ],
  },
];

/** Terms severe enough to auto-file a report against the sender. */
const AUTO_REPORT_TERMS: readonly string[] = [
  'child porn', 'underage nude', 'minor sex', 'loli', 'shota',
  'rape', 'raping', 'pedophile', 'pedo',
];

const LEET: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
  '@': 'a', $: 's',
};

/** Cheap obfuscation normalisation: leetspeak, separators, spaced-out letters. */
const normalize = (input: string): string => {
  let out = input.toLowerCase();

  // Fold leetspeak digits/symbols back to letters.
  out = out.replace(/[013457@$]/g, (c) => LEET[c] ?? c).replace(/[|!1]/g, 'i');

  // Collapse separator soup so "s-e-x" and "s.e.x" both read as "sex".
  out = out.replace(/[\s._*+~^|/\\-]+/g, ' ');

  // Squash letters split by separators: "s e x c h a t" -> "sexchat".
  // Without this, "s-e-x chat" normalises to "s e x chat" and slips past a
  // plain substring check on "sex chat".
  out = out.replace(/\b(?:[a-z] ){1,}[a-z]\b/g, (run) => run.replace(/ /g, ''));

  return out;
};

/** Does the normalized text contain this term as a token or substring? */
const containsTerm = (normalized: string, term: string): boolean =>
  normalized.includes(term);

/**
 * Inspect an outbound anonymous message. Never throws — a filter fault
 * degrades to "allowed" and is logged.
 */
export const inspectMessage = (content: string): MessageVerdict => {
  try {
    const normalized = normalize(content);

    for (const { reason, terms } of CATEGORIES) {
      for (const term of terms) {
        if (containsTerm(normalized, term)) return { allowed: false, reason };
      }
    }
    return { allowed: true };
  } catch (err) {
    logger.error({ err }, 'Moderation filter fault — failing OPEN');
    return { allowed: true };
  }
};

/** True when the message should also file a report against its sender. */
export const shouldAutoReport = (content: string): boolean => {
  try {
    const normalized = normalize(content);
    return AUTO_REPORT_TERMS.some((term) => containsTerm(normalized, term));
  } catch (err) {
    logger.error({ err }, 'Auto-report check fault — treating as not reportable');
    return false;
  }
};

/** Client-facing copy. Intentionally vague and non-accusatory. */
export const rejectionMessage = (): string =>
  "That message can't be sent in a Whisper chat. Keep it respectful.";
