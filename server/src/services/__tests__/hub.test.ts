import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getHubSummary, onFeatureChange, setFeatureFlag } from '../hub.js';

describe('getHubSummary', () => {
  it('ships every dark surface off unless the deploy enables it', () => {
    assert.deepStrictEqual(getHubSummary().features, { rooms: false, games: false, memes: false, privateRooms: false });
  });

  it('reflects the flags it is given, one by one', () => {
    const summary = getHubSummary({ rooms: true, games: false, memes: true, privateRooms: false });
    assert.deepStrictEqual(summary.features, { rooms: true, games: false, memes: true, privateRooms: false });
  });

  it('hands back a copy, so a caller cannot flip the deploy-wide flags', () => {
    const features = { rooms: false, games: false, memes: false, privateRooms: false };
    getHubSummary(features).features.rooms = true;
    assert.strictEqual(features.rooms, false);
  });
});

describe('setFeatureFlag', () => {
  it('flips one surface immediately without touching the rest', () => {
    try {
      assert.deepStrictEqual(setFeatureFlag('rooms', true), { rooms: true, games: false, memes: false, privateRooms: false });
      assert.deepStrictEqual(getHubSummary().features, { rooms: true, games: false, memes: false, privateRooms: false });
    } finally {
      setFeatureFlag('rooms', null);
    }
  });

  it('clearing restores the env value', () => {
    setFeatureFlag('games', true);
    setFeatureFlag('games', null);
    assert.deepStrictEqual(getHubSummary().features, { rooms: false, games: false, memes: false, privateRooms: false });
  });
});

describe('onFeatureChange', () => {
  it('fires only when the effective state changes, and survives a throwing listener', () => {
    const seen: Array<[string, boolean]> = [];
    const off = onFeatureChange((feature, enabled) => seen.push([feature, enabled]));
    const offBad = onFeatureChange(() => {
      throw new Error('listener bug');
    });
    try {
      setFeatureFlag('memes', true);
      setFeatureFlag('memes', true); // no change
      setFeatureFlag('memes', null); // back to env (off)
      assert.deepStrictEqual(seen, [['memes', true], ['memes', false]]);
    } finally {
      off();
      offBad();
    }
  });
});
