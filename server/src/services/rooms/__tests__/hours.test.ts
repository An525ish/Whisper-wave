import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isRoomOpen } from '../hours.js';

describe('room hours', () => {
  // Monday 2026-10-12 23:30 IST = Monday 18:00 UTC.
  const mondayNight = new Date('2026-10-12T18:00:00Z');

  it('is always open without hours', () => {
    assert.equal(isRoomOpen(undefined, mondayNight), true);
    assert.equal(isRoomOpen(null, mondayNight), true);
  });

  it('opens and closes on schedule in the template timezone', () => {
    const hours = { days: [0, 1, 2, 3, 4, 5, 6], start: '22:00', end: '03:00', tz: 'Asia/Kolkata' };
    assert.equal(isRoomOpen(hours, mondayNight), true);
    // Monday 21:00 IST — before opening.
    assert.equal(isRoomOpen(hours, new Date('2026-10-12T15:30:00Z')), false);
  });

  it('treats small hours as the previous day session (overnight)', () => {
    const hours = { days: [1], start: '22:00', end: '03:00', tz: 'Asia/Kolkata' };
    // Tuesday 01:00 IST belongs to the Monday session.
    assert.equal(isRoomOpen(hours, new Date('2026-10-12T19:30:00Z')), true);
    // Tuesday 22:30 IST is not a Monday session.
    assert.equal(isRoomOpen(hours, new Date('2026-10-13T17:00:00Z')), false);
  });

  it('respects closed days', () => {
    const hours = { days: [6], start: '10:00', end: '12:00', tz: 'Asia/Kolkata' };
    // Monday 11:00 IST, only Saturday is open.
    assert.equal(isRoomOpen(hours, new Date('2026-10-12T05:30:00Z')), false);
  });
});
