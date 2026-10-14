import { describe, expect, it } from 'vitest';
import { formatHour, nowMinutesIn, toMinutes, tzShort, windowSegments } from '../tide';

describe('tide math', () => {
  it('splits overnight windows in two', () => {
    expect(windowSegments('22:00', '03:00')).toEqual([
      { from: 1320, to: 1440 },
      { from: 0, to: 180 },
    ]);
    expect(windowSegments('10:00', '12:00')).toEqual([{ from: 600, to: 720 }]);
  });

  it('formats hours the way people say them', () => {
    expect(formatHour('22:00')).toBe('10pm');
    expect(formatHour('03:00')).toBe('3am');
    expect(formatHour('00:30')).toBe('12:30am');
    expect(formatHour('12:00')).toBe('12pm');
  });

  it('reads the clock in the given timezone', () => {
    // Monday 2026-10-12 18:00 UTC = 23:30 IST.
    expect(nowMinutesIn('Asia/Kolkata', Date.parse('2026-10-12T18:00:00Z'))).toBe(1410);
  });

  it('shortens zone names', () => {
    expect(tzShort('Asia/Kolkata')).toBe('Kolkata');
    expect(toMinutes('09:05')).toBe(545);
  });
});
