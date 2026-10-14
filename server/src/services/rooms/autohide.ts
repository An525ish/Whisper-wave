import { ROOM_AUTOHIDE_REPORTERS } from '../../constants/rooms.js';
import { hideMessage, isSeated, onInstanceClosed } from './registry.js';

/** A report counts toward auto-hide for this long, then is forgotten. */
const REPORT_TTL_MS = 30 * 60 * 1000;
const MAX_TRACKED = 2_000;

type Tally = { reporters: Set<string>; firstAt: number };

/** instanceId → messageId → tally. Bounded, TTL'd, and pruned when the instance closes. */
const tallies = new Map<string, Map<string, Tally>>();

onInstanceClosed((instanceId) => {
  tallies.delete(instanceId);
});

const trackedCount = (): number => {
  let n = 0;
  for (const inner of tallies.values()) n += inner.size;
  return n;
};

/** Drop tallies past their TTL (namespace sweep). */
export const pruneReportTallies = (now: number = Date.now()): void => {
  for (const [instanceId, inner] of tallies) {
    for (const [messageId, tally] of inner) {
      if (now - tally.firstAt > REPORT_TTL_MS) inner.delete(messageId);
    }
    if (inner.size === 0) tallies.delete(instanceId);
  }
};

/**
 * Record one reporter's report; at `ROOM_AUTOHIDE_REPORTERS` distinct reporters
 * the message hides for everyone pending review (hidden, never deleted).
 *
 * Only reporters currently SEATED in the instance count — otherwise one person
 * with a few throwaway gids could silence anyone. Returns true when this report
 * tipped the message into hidden.
 */
export const recordRoomReport = (instanceId: string, messageId: string, reporterKey: string): boolean => {
  if (!isSeated(instanceId, reporterKey)) return false;
  const inner = tallies.get(instanceId) ?? new Map<string, Tally>();
  let tally = inner.get(messageId);
  if (!tally) {
    if (trackedCount() >= MAX_TRACKED) pruneReportTallies();
    if (trackedCount() >= MAX_TRACKED) return false;
    tally = { reporters: new Set(), firstAt: Date.now() };
    inner.set(messageId, tally);
    tallies.set(instanceId, inner);
  }
  tally.reporters.add(reporterKey);
  // Re-check seating at the threshold: seats may have been left since the report.
  const seated = [...tally.reporters].filter((key) => isSeated(instanceId, key)).length;
  if (seated < ROOM_AUTOHIDE_REPORTERS) return false;
  inner.delete(messageId);
  return hideMessage(instanceId, messageId);
};
