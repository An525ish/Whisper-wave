import type { VibeTag } from '../types';
import { vibeTagLabel } from './vibeTag';
import { formatThreadDuration } from './threadSummary';

/**
 * A small, on-device archive of threads that ended.
 *
 * The product's pitch is that chats vanish when you leave. That is the right
 * default — but it also means "I don't want to lose this" has no answer at all.
 * This is that answer, and it is deliberately the only one: the list stays in
 * this browser's `localStorage`, is never uploaded, and never touches a socket
 * or an endpoint, so the anonymity the product promises about the *other* person
 * is not weakened by remembering them.
 *
 * NOT A CREDENTIAL — nothing here authorises anything. The `anonId` that
 * actually authorises an anon session is an httpOnly cookie the client cannot
 * read, and the repo's rule is cookies-only (no access tokens in
 * `localStorage`). There is deliberately no token, no session id and no room id
 * in this file or in the data it stores. Worst case: the key is cleared and the
 * archive starts empty. See `anonIdentityStorage.ts` for the same reasoning on
 * the saved alias.
 *
 * WHAT IS STORED: the two vibe aliases, the tags they had in common, how long
 * it lasted, how many messages, and when it ended.
 *
 * WHAT IS NEVER STORED: message content of any kind, per-message timestamps, IP
 * addresses, device or user ids, or anything else that could identify either
 * side. That constraint IS the feature — this is a memory of a conversation,
 * never a transcript of one. `WhisperHistoryEntry` has no field for content and
 * must not grow one.
 */

const STORAGE_KEY = 'whisper:history';

/** Newest first, capped. An unbounded list in `localStorage` is a quota bug waiting to happen. */
export const MAX_WHISPER_HISTORY = 20;

export type WhisperHistoryEntry = {
  myAlias: string;
  partnerAlias: string;
  sharedTags: VibeTag[];
  durationMs: number;
  messageCount: number;
  /** Unix ms. Required — a row with no end time is not a finished thread. */
  endedAt: number;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isFiniteAtLeastZero = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * `unknown` → entry, or `null` when the row can't be trusted.
 *
 * Anything that fails here is DROPPED, not repaired: a half-valid row in the
 * archive is worse than a missing one, because it would render as a lie about a
 * conversation that happened.
 */
const toHistoryEntry = (raw: unknown): WhisperHistoryEntry | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as Partial<WhisperHistoryEntry>;

  if (!isNonEmptyString(candidate.myAlias)) return null;
  if (!isNonEmptyString(candidate.partnerAlias)) return null;
  if (!isFiniteAtLeastZero(candidate.durationMs)) return null;
  if (!isFiniteAtLeastZero(candidate.messageCount)) return null;
  if (!isPositiveNumber(candidate.endedAt)) return null;

  return {
    myAlias: candidate.myAlias,
    partnerAlias: candidate.partnerAlias,
    sharedTags: Array.isArray(candidate.sharedTags)
      ? candidate.sharedTags.filter((tag): tag is VibeTag => typeof tag === 'string')
      : [],
    durationMs: candidate.durationMs,
    messageCount: Math.trunc(candidate.messageCount),
    endedAt: candidate.endedAt,
  };
};

/**
 * The archive, newest first.
 *
 * Returns `[]` for *every* failure mode — storage disabled, private-mode Safari
 * throwing on property access, corrupt JSON, valid JSON that isn't an array, or
 * rows with wrong field types. The caller renders this on a normal page, so it
 * must never throw and must never block boot.
 */
export const readWhisperHistory = (): WhisperHistoryEntry[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(toHistoryEntry)
      .filter((entry): entry is WhisperHistoryEntry => entry !== null)
      .slice(0, MAX_WHISPER_HISTORY);
  } catch {
    // Disabled storage and private-mode Safari throw on access; corrupt JSON
    // throws on parse. Same answer either way: there is no history.
    return [];
  }
};

/**
 * Archive a finished thread at the head of the list and trim to the cap.
 * Silently no-ops when the entry is malformed or storage is unavailable.
 */
export const appendWhisperHistory = (entry: WhisperHistoryEntry): void => {
  if (typeof window === 'undefined') return;

  const valid = toHistoryEntry(entry);
  if (!valid) return;

  try {
    // Two threads cannot end in the same millisecond, so `endedAt` doubles as
    // the idempotence key — which keeps a double-fired end-of-thread effect
    // from archiving the same conversation twice.
    const next = [valid, ...readWhisperHistory().filter((row) => row.endedAt !== valid.endedAt)].slice(
      0,
      MAX_WHISPER_HISTORY
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode — the archive simply won't survive a reload.
  }
};

/** Forget every archived thread (the archive's own "clear" control). */
export const clearWhisperHistory = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // It was never stored, or storage is unavailable. Nothing to do.
  }
};

const pluralizeMessages = (count: number): string =>
  `${count} ${count === 1 ? 'message' : 'messages'}`;

/**
 * One archive line, e.g. `you + blue_static · 12m · 38 messages · cozy, memes`.
 *
 * Pure so the archive list, a hover title and a future detail view all read the
 * same. Shares `formatThreadDuration` with the summary card, so a duration can
 * never be rendered two different ways.
 */
export const formatWhisperHistoryEntry = (entry: WhisperHistoryEntry): string => {
  const partner = entry.partnerAlias.trim().split(/\s+/)[0] || 'someone';
  const messages = Number.isFinite(entry.messageCount)
    ? Math.max(0, Math.trunc(entry.messageCount))
    : 0;

  const parts = [
    `you + ${partner}`,
    formatThreadDuration(entry.durationMs),
    pluralizeMessages(messages),
  ];

  if (entry.sharedTags.length > 0) {
    parts.push(entry.sharedTags.map(vibeTagLabel).join(', '));
  }

  return parts.join(' · ');
};
