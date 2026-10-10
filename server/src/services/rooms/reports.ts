import { ROOM_AUTOHIDE_REPORTERS } from '../../constants/rooms.js';
import * as reportRepo from '../../repositories/report.js';
import { hideMessage, recentMessages } from './registry.js';
import type { RoomEvidenceItem } from '../../types/match.js';
import type { LiveRoomMessage } from '../../types/room.js';
import type { RoomReportInput } from '../../types/report.js';

/**
 * The reported message plus neighbours (alias + text + ts only) — the narrow,
 * disclosed exception to "rooms leave no transcript". No IPs, no identities.
 */
export const buildEvidenceSnapshot = (
  ring: LiveRoomMessage[],
  messageId: string,
  radius = 15
): RoomEvidenceItem[] => {
  const index = ring.findIndex((m) => m.id === messageId);
  const window =
    index === -1 ? ring.slice(-radius) : ring.slice(Math.max(0, index - radius), index + radius + 1);
  return window.map((m) => ({ alias: m.alias, text: m.text, ts: m.ts }));
};

/**
 * File a room-message report with its evidence snapshot.
 *
 * The reporter names a message, never a person — the target is whatever alias
 * holds it. Reports never auto-delete; auto-hide only removes from history.
 */
export const fileRoomReport = async (input: RoomReportInput): Promise<void> => {
  const snapshot = buildEvidenceSnapshot(recentMessages(input.instanceId, 100), input.messageId);
  await reportRepo.create({
    reporter: input.reporterUserId ?? null,
    reporterAnonId: input.reporterAnonId ?? null,
    reporterGid: input.reporterGid ?? null,
    targetType: 'roomMessage',
    roomSlug: input.roomSlug,
    evidence: snapshot,
    reason: input.reason,
    details: input.details?.trim() || null,
  });
};

/** instanceId:messageId → reporter keys. Never auto-deletes, only hides. */
const reportCounts = new Map<string, Set<string>>();

/**
 * Record one reporter's report. At `ROOM_AUTOHIDE_REPORTERS` distinct
 * reporters the message hides for everyone pending review — hidden, never
 * deleted, and the evidence snapshot above is the audit trail.
 */
export const recordRoomReport = (instanceId: string, messageId: string, reporterKey: string): boolean => {
  const key = `${instanceId}:${messageId}`;
  let reporters = reportCounts.get(key);
  if (!reporters) {
    reporters = new Set();
    reportCounts.set(key, reporters);
  }
  reporters.add(reporterKey);
  if (reporters.size < ROOM_AUTOHIDE_REPORTERS) return false;
  reportCounts.delete(key);
  return hideMessage(instanceId, messageId);
};
