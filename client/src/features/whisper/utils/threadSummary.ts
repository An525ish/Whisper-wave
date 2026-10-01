import type { AnonMessage, VibeTag } from '../types';
import { threadStats } from './threadStats';

/**
 * Everything the end-of-thread card needs, derived in one pure pass.
 *
 * `durationMs` is kept alongside the formatted label because the archive
 * (`whisperHistory.ts`) stores the number and formats it at render time — one
 * duration formatter, not two that drift.
 */
export type ThreadSummary = {
  /** Clamped at 0. Never negative, never NaN. */
  durationMs: number;
  /** `"0m"`, `"4m"`, `"1h 12m"`. */
  durationLabel: string;
  totalMessages: number;
  myMessages: number;
  theirMessages: number;
  /** Tags both sides had, matched case-insensitively, in the caller's casing. */
  sharedTags: VibeTag[];
  /** One warm line. Never implies the other person did something wrong. */
  verdict: string;
};

const MS_PER_MINUTE = 60_000;

/** Verdict buckets. Minutes, not ms — a thread under a minute isn't a "short chat". */
const LONG_ENOUGH_MINUTES = 10;
const REAL_CHAT_MINUTES = 5;
const BACK_AND_FORTH_MINUTES = 3;
const QUIET_MESSAGE_CEILING = 6;
const LOUD_MESSAGE_FLOOR = 14;
const CHATTY_MESSAGE_FLOOR = 8;

/** Coerce anything the caller (or `localStorage`) hands us into a usable ms count. */
const toMs = (ms: number): number =>
  Number.isFinite(ms) && ms > 0 ? ms : 0;

/**
 * `"0m"` / `"4m"` / `"12m"` / `"1h"` / `"1h 12m"`.
 *
 * Distinct from `formatDuration` in `threadStats.ts`, which is the live panel's
 * "4 min together" headline. This is the compact stat-tile form.
 */
export const formatThreadDuration = (durationMs: number): string => {
  const totalMinutes = Math.floor(toMs(durationMs) / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${totalMinutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

/**
 * The one-line verdict.
 *
 * Judged on duration + volume only, and deliberately phrased so that no branch
 * reads as a verdict ON either person. "Quiet" and "non-stop" are both just
 * kinds of conversation — an anon chat has no context to blame anyone with, and
 * a card that implies fault is a card that makes people leave.
 */
export const threadVerdict = (durationMs: number, totalMessages: number): string => {
  const minutes = Math.floor(toMs(durationMs) / MS_PER_MINUTE);
  const messages = Number.isFinite(totalMessages) ? Math.max(0, Math.trunc(totalMessages)) : 0;

  if (messages === 0) {
    return 'No words, no hard feelings. Half of serendipity is just timing.';
  }
  if (minutes >= LONG_ENOUGH_MINUTES && messages <= QUIET_MESSAGE_CEILING) {
    return 'You stayed a while. That takes patience with a total stranger.';
  }
  if (messages >= LOUD_MESSAGE_FLOOR) {
    return minutes >= REAL_CHAT_MINUTES
      ? 'That was a real one — you two actually talked.'
      : 'Non-stop, honestly. Some people just don’t slow down.';
  }
  if (messages >= CHATTY_MESSAGE_FLOOR) {
    return minutes >= BACK_AND_FORTH_MINUTES
      ? 'A good back-and-forth. That’s the good stuff.'
      : 'Quick-fire and fun. It happens.';
  }
  return messages <= 2
    ? 'A short hello. That still counts with a stranger.'
    : 'A few real minutes with someone new.';
};

/**
 * Derive the end-of-thread summary.
 *
 * Message counts and the shared-tag intersection come from `threadStats` — the
 * same derivation the live identity panel uses, so the two can never disagree
 * about what happened. What's new here is the precise duration and the verdict.
 *
 * `startedAt` is the caller's Unix-ms match time and may legitimately be `null`
 * (no live thread) or in the future (clock skew between two phones). Both
 * collapse to a zero duration rather than a negative or `NaN` one.
 */
export const deriveThreadSummary = (
  messages: AnonMessage[],
  myTags: VibeTag[],
  partnerTags: VibeTag[],
  startedAt: number | null,
  endedAt: number
): ThreadSummary => {
  const stats = threadStats(messages, myTags, partnerTags, startedAt, endedAt);

  const hasStart = startedAt !== null && Number.isFinite(startedAt) && startedAt > 0;
  const durationMs = hasStart ? Math.max(0, toMs(endedAt) - toMs(startedAt)) : 0;

  return {
    durationMs,
    durationLabel: formatThreadDuration(durationMs),
    totalMessages: stats.totalMessages,
    myMessages: stats.myMessages,
    theirMessages: stats.theirMessages,
    sharedTags: stats.sharedTags,
    verdict: threadVerdict(durationMs, stats.totalMessages),
  };
};
