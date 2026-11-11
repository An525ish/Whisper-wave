import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adsTxt, buildAdsConfig } from '../ads.js';

const ON = { client: 'ca-pub-1234567890123456', waiting: '1111111111', between: '2222222222' };

describe('ads config', () => {
  it('is off without a publisher id or without any slot', () => {
    assert.equal(buildAdsConfig({ client: '', waiting: '1', between: '2' }, false).enabled, false);
    assert.equal(buildAdsConfig({ client: ON.client, waiting: '', between: '' }, false).enabled, false);
  });

  it('is on with an id and at least one slot, and exposes only the slots that exist', () => {
    const cfg = buildAdsConfig({ ...ON, between: '' }, false);
    assert.equal(cfg.enabled, true);
    assert.equal(cfg.slots.waiting, '1111111111');
    assert.equal(cfg.slots.between, null);
  });

  it('gives a Spark Pass holder nothing, not even the ids', () => {
    const cfg = buildAdsConfig(ON, true);
    assert.deepEqual(cfg, { enabled: false, client: null, slots: { waiting: null, between: null } });
  });

  it('writes ads.txt the way Google expects', () => {
    assert.equal(adsTxt('ca-pub-1234567890123456'), 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n');
  });
});
