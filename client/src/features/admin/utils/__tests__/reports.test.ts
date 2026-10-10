import { describe, expect, it } from 'vitest';
import { slaStatus } from '../reports';

const NOW = Date.now();
const iso = (msAgo: number): string => new Date(NOW - msAgo).toISOString();

describe('report SLA clocks', () => {
  it('gives sexual-adjacent reasons the 2-hour clock', () => {
    const sla = slaStatus(iso(60 * 60_000), 'underage', NOW);
    expect(sla.breached).toBe(false);
    expect(sla.label).toContain('2h SLA');
    expect(sla.label).toContain('left');
  });

  it('breaches loudly past the clock', () => {
    const sla = slaStatus(iso(3 * 60 * 60_000), 'inappropriate_content', NOW);
    expect(sla.breached).toBe(true);
    expect(sla.label).toContain('over');
  });

  it('gives ordinary reasons the 7-day clock', () => {
    const sla = slaStatus(iso(60 * 60_000), 'spam', NOW);
    expect(sla.breached).toBe(false);
    expect(sla.label).toContain('7d SLA');
  });
});
