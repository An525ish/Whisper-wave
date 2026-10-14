/** Derived and local-only whisper models (storage, stats, UI state). Types only. */

import type { AnonSocketRef } from './socket';
import type { AnonReaction, Gender, VibeTag } from './core';
import type { RadarFloatItem, RadarFloatSpot } from '../utils/radarFloat';

/** A returning guest's saved identity card (localStorage). */
export type StoredIdentity = {
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;
};

/** The two aliases decoded from a connectToken, for auth-screen copy. */
export type TokenAliases = { self?: string; partner?: string };

/** What the panel shows about the thread you're currently in (or just left). */
export type ThreadStats = {
  /** Whole minutes in the thread, floored. */
  minutes: number;
  totalMessages: number;
  myMessages: number;
  theirMessages: number;
  /** Tags both sides picked — the thing that made the match plausible. */
  sharedTags: VibeTag[];
};

/** Your vibe tags against theirs, split for the overlap view. */
export type VibeOverlap = {
  /** In both, in your casing. */
  shared: VibeTag[];
  onlyMine: VibeTag[];
  onlyTheirs: VibeTag[];
};

/** A suggested opener the user can drop into the composer. */
export type Spark = {
  key: string;
  emoji: string;
  text: string;
};

/** A link that appeared in the thread, newest first in lists. */
export type ThreadLink = {
  url: string;
  /** Hostname without a leading `www.` — what the row shows. */
  host: string;
  from: 'me' | 'them';
  sentAt: number;
};

/** How often each side has used one curated reaction in this thread. */
export type ReactionTally = {
  reaction: AnonReaction;
  me: number;
  them: number;
};

/** Which half of the profile rail is showing. */
export type ProfileTab = 'them' | 'you';

/** Everything the end-of-thread card needs, derived in one pure pass. */
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

/** Which control asked to skip the current match — analytics label only. */
export type NextSource = 'chat' | 'partner_left' | 'report';

/** Why a Back press / chevron tap is waiting on the user's answer. */
export type LeaveConfirmKind = 'leave' | 'skip';

/** Where a DM open came from — analytics label only. */
export type DmOpenSource = 'whisper' | 'resume_after_auth' | 'connection_ready' | 'pending';

/** One row of the virtualized thread. */
export type ThreadRow =
  | { kind: 'lead' }
  | { kind: 'empty' }
  | { kind: 'typing' }
  | { kind: 'message'; index: number };

/** What `WhisperSessionProvider` shares: the owned socket plus typing state. */
export type WhisperSession = {
  /** The `/anon` connection. Owned by the provider; screens only send through it. */
  socketRef: AnonSocketRef;
  partnerTyping: boolean;
  setPartnerTyping: (v: boolean) => void;
};

/** Radar background: floating items and the spots they occupy. */
export type FloatLayout = { items: RadarFloatItem[]; spots: RadarFloatSpot[] };
