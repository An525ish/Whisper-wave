/**
 * Report SLA clocks (see docs/RUNBOOK.md). Sexual/nudity-adjacent reasons get
 * the 2-hour clock; everything else gets 7 days. Conservative mapping: a
 * harassment report that turns out sexual still met the tighter clock.
 */
const TWO_HOUR_MS = 2 * 3_600_000;
const SEVEN_DAY_MS = 7 * 24 * 3_600_000;

const FAST_REASONS = new Set(['inappropriate_content', 'underage']);

export type SlaStatus = {
  ageMs: number;
  slaMs: number;
  breached: boolean;
  /** Short human line: `1h12m old · 48m left (2h SLA)`. */
  label: string;
};

const duration = (ms: number): string => {
  if (ms < 0) return 'overdue';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ${mins % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

export const slaStatus = (createdAt: string, reason: string, now: number = Date.now()): SlaStatus => {
  const ageMs = Math.max(0, now - Date.parse(createdAt));
  const slaMs = FAST_REASONS.has(reason) ? TWO_HOUR_MS : SEVEN_DAY_MS;
  const left = slaMs - ageMs;
  const slaLabel = slaMs === TWO_HOUR_MS ? '2h SLA' : '7d SLA';
  return {
    ageMs,
    slaMs,
    breached: left < 0,
    label: `${duration(ageMs)} old · ${left < 0 ? `${duration(-left)} over` : `${duration(left)} left`} (${slaLabel})`,
  };
};
