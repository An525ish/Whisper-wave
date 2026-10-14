import * as memeBlockRepo from '../../repositories/memeBlock.js';
import { blockJokeId } from './blocklist.js';
import type { MemeReportBody, MemeReportResult } from '../../types/memeBlock.js';

/**
 * Report intake: each distinct reporter (gid) counts once per joke inside
 * the dedupe window; the joke auto-blocks when accepted reports reach the
 * threshold. The dedupe map is in-process and bounded — a restart or a second
 * instance can let a repeat through, which only costs one extra count; the
 * per-IP report limiter and the gid cookie bound abuse, and an admin can
 * always un-block.
 */
export const REPORT_BLOCK_THRESHOLD = 3;
const REPORT_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_DEDUPE_ENTRIES = 20_000;

/** Pure: does this report count push the joke over the line? */
export const shouldAutoBlock = (reports: number, alreadyBlocked: boolean): boolean =>
  !alreadyBlocked && reports >= REPORT_BLOCK_THRESHOLD;

/** Bounded "seen recently" map: true on first sight inside the window. */
export const createReportDeduper = (maxEntries: number, windowMs: number) => {
  const seen = new Map<string, number>();
  return (key: string, now: number): boolean => {
    const until = seen.get(key);
    if (until !== undefined && until > now) return false;
    seen.delete(key); // re-insert at the tail so Map order is expiry order
    if (seen.size >= maxEntries) {
      // Fixed window → insertion order is expiry order: shed expired heads,
      // and if the head is still live, drop that one too rather than grow.
      for (const [k, exp] of seen) {
        seen.delete(k);
        if (exp > now) break;
      }
    }
    seen.set(key, now + windowMs);
    return true;
  };
};

const firstSight = createReportDeduper(MAX_DEDUPE_ENTRIES, REPORT_DEDUPE_WINDOW_MS);

export const reportJoke = async (gid: string, body: MemeReportBody): Promise<MemeReportResult> => {
  if (!firstSight(`${gid}:${body.source}:${body.externalId}`, Date.now())) {
    return { counted: false, blocked: false };
  }
  const row = await memeBlockRepo.recordReport(body.externalId, body.source, body.reason);
  if (shouldAutoBlock(row.reports, row.blocked)) {
    await blockJokeId(body.externalId, `auto: ${row.reports} reports`);
    return { counted: true, blocked: true };
  }
  return { counted: true, blocked: row.blocked };
};
