import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getHubSummary, setFeatureFlag } from '../hub.js';

describe('getHubSummary', () => {
  it('ships every dark surface off unless the deploy enables it', () => {
    assert.deepStrictEqual(getHubSummary().features, { rooms: false, games: false, memes: false });
  });

  it('reflects the flags it is given, one by one', () => {
    const summary = getHubSummary({ rooms: true, games: false, memes: true });
    assert.deepStrictEqual(summary.features, { rooms: true, games: false, memes: true });
  });

  it('hands back a copy, so a caller cannot flip the deploy-wide flags', () => {
    const features = { rooms: false, games: false, memes: false };
    getHubSummary(features).features.rooms = true;
    assert.strictEqual(features.rooms, false);
  });
});

describe('setFeatureFlag', () => {
  it('flips one surface immediately without touching the rest', () => {
    try {
      assert.deepStrictEqual(setFeatureFlag('rooms', true), { rooms: true, games: false, memes: false });
      assert.deepStrictEqual(getHubSummary().features, { rooms: true, games: false, memes: false });
    } finally {
      setFeatureFlag('rooms', null);
    }
  });

  it('clearing restores the env value', () => {
    setFeatureFlag('games', true);
    setFeatureFlag('games', null);
    assert.deepStrictEqual(getHubSummary().features, { rooms: false, games: false, memes: false });
  });
});
