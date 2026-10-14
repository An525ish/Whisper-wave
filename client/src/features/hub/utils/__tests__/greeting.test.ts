import { describe, expect, it } from 'vitest';
import { hourGreeting } from '../greeting';

describe('hourGreeting', () => {
  it('follows the day', () => {
    expect(hourGreeting(5)).toBe('Good morning');
    expect(hourGreeting(11)).toBe('Good morning');
    expect(hourGreeting(12)).toBe('Good afternoon');
    expect(hourGreeting(17)).toBe('Good evening');
    expect(hourGreeting(22)).toBe('Up late?');
    expect(hourGreeting(3)).toBe('Up late?');
  });
});
