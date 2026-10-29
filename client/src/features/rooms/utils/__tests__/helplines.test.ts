import { describe, expect, it } from 'vitest';
import { helplinesFor, regionOf } from '../helplines';
import { isJoinable } from '../roomStatus';

describe('helplines', () => {
  it('picks the region from the locale, then unambiguous timezones', () => {
    expect(regionOf('en-IN', 'UTC')).toBe('IN');
    expect(regionOf('en', 'Asia/Kolkata')).toBe('IN');
    expect(regionOf('en-US', 'America/New_York')).toBe('US');
    expect(regionOf('en', 'America/New_York')).toBeNull();
  });

  it('lists local lines first and always ends with the worldwide directory', () => {
    const india = helplinesFor('en-IN', 'Asia/Kolkata');
    expect(india[0]?.contact).toBe('14416');
    expect(india.at(-1)?.href).toBe('https://findahelpline.com');
    expect(helplinesFor('fr', 'Europe/Paris')).toHaveLength(1);
  });

  it('only hours close a room — waiting_mod is still joinable', () => {
    expect(isJoinable({ status: 'waiting_mod' })).toBe(true);
    expect(isJoinable({ status: 'closed' })).toBe(false);
  });
});
