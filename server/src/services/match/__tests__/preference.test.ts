import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PREFER_HOLD_MS, acceptsPartner, holdRemainingMs, isHolding, matchesPreference } from '../preference.js';

const T0 = 1_000_000;
const person = (gender: 'male' | 'female' | 'other' | 'prefer_not_to_say') => ({ gender });

describe('Spark Pass preferences', () => {
  const wantsFemale = { prefer: 'female' as const, preferSince: T0 };

  it('is strict inside the hold and open to anyone after it', () => {
    assert.equal(isHolding(wantsFemale, T0 + 1), true);
    assert.equal(acceptsPartner(wantsFemale, person('female'), T0 + 1), true);
    assert.equal(acceptsPartner(wantsFemale, person('male'), T0 + 1), false);
    assert.equal(acceptsPartner(wantsFemale, person('prefer_not_to_say'), T0 + 1), false);
    assert.equal(acceptsPartner(wantsFemale, person('male'), T0 + PREFER_HOLD_MS), true);
  });

  it('never filters anyone without a preference', () => {
    assert.equal(acceptsPartner({}, person('male'), T0), true);
    assert.equal(acceptsPartner({ preferSince: T0 }, person('other'), T0), true);
  });

  it('does not hold without a start time (a card that never entered the queue)', () => {
    assert.equal(isHolding({ prefer: 'male' }, T0), false);
  });

  it('reports the time left, never negative', () => {
    assert.equal(holdRemainingMs(wantsFemale, T0 + 5_000), PREFER_HOLD_MS - 5_000);
    assert.equal(holdRemainingMs(wantsFemale, T0 + PREFER_HOLD_MS + 1), 0);
    assert.equal(holdRemainingMs({}, T0), 0);
  });

  it('ranks a fit only when something was asked for', () => {
    assert.equal(matchesPreference({ prefer: 'male' }, person('male')), true);
    assert.equal(matchesPreference({ prefer: 'male' }, person('female')), false);
    assert.equal(matchesPreference({}, person('male')), false);
  });
});
