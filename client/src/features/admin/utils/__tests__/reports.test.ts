import { describe, expect, it } from 'vitest';
import { formatDuration, slaStatus } from '../reports';

const NOW = Date.now();
const iso = (msAgo: number): string => new Date(NOW - msAgo).toISOString();

describe('report SLA clocks', () => {
  it.each(['underage', 'inappropriate_content', 'impersonation'])('gives %s the 2-hour clock', (reason) => {
    const sla = slaStatus(iso(60 * 60_000), reason, NOW);
    expect(sla.breached).toBe(false);
    expect(sla.label).toContain('2h SLA');
    expect(sla.label).toContain('left');
  });

  it('breaches loudly past the clock', () => {
    const sla = slaStatus(iso(3 * 60 * 60_000), 'impersonation', NOW);
    expect(sla.breached).toBe(true);
    expect(sla.label).toContain('over');
  });

  it('gives ordinary reasons ack 24h and resolve 7d', () => {
    const sla = slaStatus(iso(60 * 60_000), 'spam', NOW);
    expect(sla.breached).toBe(false);
    expect(sla.label).toContain('24h ack / 7d resolve');
  });

  it('breaches an ordinary report once the ack window passes', () => {
    const sla = slaStatus(iso(25 * 60 * 60_000), 'harassment', NOW);
    expect(sla.breached).toBe(true);
    expect(sla.label).toContain('ack 1h 0m over');
  });
});

describe('formatDuration', () => {
  it('formats minutes, hours and days', () => {
    expect(formatDuration(5 * 60_000)).toBe('5m');
    expect(formatDuration(75 * 60_000)).toBe('1h 15m');
    expect(formatDuration(50 * 3_600_000)).toBe('2d 2h');
    expect(formatDuration(-1)).toBe('overdue');
  });
});
