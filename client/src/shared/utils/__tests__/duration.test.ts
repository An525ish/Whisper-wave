import { describe, expect, it } from 'vitest';
import { expiryLabel, formatCountdown } from '../duration';

describe('formatCountdown', () => {
  it('rounds up so it never shows 0:00 while time remains', () => {
    expect(formatCountdown(1)).toBe('0:01');
    expect(formatCountdown(545_000)).toBe('9:05');
    expect(formatCountdown(-5)).toBe('0:00');
  });
});

describe('expiryLabel', () => {
  it('picks the coarsest honest unit', () => {
    expect(expiryLabel(30_000)).toBe('under a minute');
    expect(expiryLabel(42 * 60_000)).toBe('42 min');
    expect(expiryLabel((23 * 60 + 50) * 60_000)).toBe('23h 50m');
    expect(expiryLabel(26 * 3_600_000)).toBe('1d');
  });
});
