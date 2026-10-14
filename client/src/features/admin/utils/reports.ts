import type { AdminReportRow, SlaStatus } from '../types';

/**
 * Report SLA clocks (docs/RUNBOOK.md). Sexual/nudity/impersonation reports get
 * the 2-hour removal clock; everything else is acknowledged within 24 hours
 * and resolved within 7 days. Conservative mapping: a harassment report that
 * turns out sexual still met the tighter clock.
 */
const HOUR_MS = 3_600_000;
const TWO_HOUR_MS = 2 * HOUR_MS;
const ACK_MS = 24 * HOUR_MS;
const SEVEN_DAY_MS = 7 * 24 * HOUR_MS;

const FAST_REASONS = new Set(['inappropriate_content', 'underage', 'impersonation']);

export const formatDuration = (ms: number): string => {
  if (ms < 0) return 'overdue';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ${mins % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

const clockLeft = (ms: number): string => (ms < 0 ? `${formatDuration(-ms)} over` : `${formatDuration(ms)} left`);

export const slaStatus = (createdAt: string, reason: string, now: number = Date.now()): SlaStatus => {
  const ageMs = Math.max(0, now - Date.parse(createdAt));
  const age = `${formatDuration(ageMs)} old`;
  if (FAST_REASONS.has(reason)) {
    const left = TWO_HOUR_MS - ageMs;
    return { ageMs, slaMs: TWO_HOUR_MS, breached: left < 0, label: `${age} · ${clockLeft(left)} (2h SLA)` };
  }
  const ackLeft = ACK_MS - ageMs;
  const resolveLeft = SEVEN_DAY_MS - ageMs;
  return {
    ageMs,
    slaMs: SEVEN_DAY_MS,
    breached: ackLeft < 0,
    label: `${age} · ack ${clockLeft(ackLeft)} · resolve ${clockLeft(resolveLeft)} (24h ack / 7d resolve)`,
  };
};

/** Who the report is about: guest id or account id; room context in the title. */
export const offenderLabel = (report: AdminReportRow): string => {
  if (report.targetGid) return `guest ${report.targetGid.slice(0, 8)}`;
  if (report.targetUserId) return `user ${report.targetUserId.slice(-6)}`;
  return report.targetType === 'anonSession' ? 'anonymous session' : 'unknown offender';
};

export const targetLabel = (report: AdminReportRow): string => {
  switch (report.targetType) {
    case 'roomMessage':
      return report.roomSlug ? `room message · ${report.roomSlug}` : 'room message';
    case 'anonSession':
      return 'anonymous session';
    case 'user':
      return 'user';
  }
};

/** Whether the room-message actions (hide/ban) apply to this report. */
export const isRoomReport = (report: AdminReportRow): boolean => report.targetType === 'roomMessage';

/** Ban durations offered in the report action menu (server allows 1..525600 min). */
export const BAN_DURATIONS: ReadonlyArray<{ minutes: number; label: string }> = [
  { minutes: 60, label: '1 hour' },
  { minutes: 1440, label: '24 hours' },
  { minutes: 10_080, label: '7 days' },
  { minutes: 43_200, label: '30 days' },
];
