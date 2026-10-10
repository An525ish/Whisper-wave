import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeTrust } from '../trust.js';

const DAY = 24 * 3_600_000;
const NOW = Date.now();

describe('trust ladder', () => {
  it('grades by age and recent strikes', () => {
    assert.equal(computeTrust({ createdAt: new Date(NOW - 1 * 3_600_000), now: NOW }), 'new');
    assert.equal(computeTrust({ createdAt: new Date(NOW - 2 * DAY), now: NOW }), 'standard');
    assert.equal(computeTrust({ createdAt: new Date(NOW - 8 * DAY), now: NOW }), 'trusted');
  });

  it('a recent strike sinks trusted to standard, old ones forgive', () => {
    assert.equal(
      computeTrust({
        createdAt: new Date(NOW - 30 * DAY),
        strikes: [{ at: new Date(NOW - 2 * DAY) }],
        now: NOW,
      }),
      'standard'
    );
    assert.equal(
      computeTrust({
        createdAt: new Date(NOW - 60 * DAY),
        strikes: [{ at: new Date(NOW - 40 * DAY) }],
        now: NOW,
      }),
      'trusted'
    );
  });

  it('accepts ISO strings from lean documents', () => {
    assert.equal(
      computeTrust({ createdAt: new Date(NOW - 8 * DAY).toISOString(), strikes: [], now: NOW }),
      'trusted'
    );
  });
});
