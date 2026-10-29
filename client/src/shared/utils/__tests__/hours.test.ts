import { describe, expect, it } from 'vitest';
import { formatHour, tzShort } from '../hours';

describe('hours labels', () => {
  it('formats hours the way people say them', () => {
    expect(formatHour('22:00')).toBe('10pm');
    expect(formatHour('03:00')).toBe('3am');
    expect(formatHour('00:30')).toBe('12:30am');
    expect(formatHour('12:00')).toBe('12pm');
  });

  it('shortens zone names', () => {
    expect(tzShort('Asia/Kolkata')).toBe('Kolkata');
  });
});
