import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { DAY_MS, PASS_PLANS, findPlan } from '../../../constants/plans.js';
import { isPassActive } from '../../user/entitlements.js';
import { hmacMatches } from '../razorpay.js';

const sign = (data: string | Buffer, secret: string) => createHmac('sha256', secret).update(data).digest('hex');

describe('pass plans', () => {
  it('has unique ids, whole-rupee prices and longer plans costing more per pass', () => {
    assert.equal(new Set(PASS_PLANS.map((p) => p.id)).size, PASS_PLANS.length);
    for (const p of PASS_PLANS) {
      assert.ok(p.amountPaise > 0 && p.amountPaise % 100 === 0, `${p.id} price`);
      assert.ok(p.days >= 1);
    }
    const perDay = PASS_PLANS.map((p) => p.amountPaise / p.days);
    for (let i = 1; i < perDay.length; i++) assert.ok(perDay[i] < perDay[i - 1], 'longer plans are cheaper per day');
  });

  it('only finds plans we sell', () => {
    assert.equal(findPlan('month')?.days, 30);
    assert.equal(findPlan('lifetime'), undefined);
    assert.equal(findPlan('__proto__'), undefined);
  });

  it('expresses a day in ms', () => assert.equal(DAY_MS, 86_400_000));
});

describe('isPassActive', () => {
  const now = 1_000;
  it('is live only while the expiry is in the future', () => {
    assert.equal(isPassActive(new Date(now + 1), now), true);
    assert.equal(isPassActive(new Date(now), now), false);
    assert.equal(isPassActive(new Date(now - 1), now), false);
    assert.equal(isPassActive(null, now), false);
    assert.equal(isPassActive(undefined, now), false);
  });
});

describe('hmacMatches', () => {
  const secret = 'whsec_test';
  const body = Buffer.from('{"event":"payment.captured"}');

  it('accepts the right signature over the exact bytes', () => {
    assert.equal(hmacMatches(body, secret, sign(body, secret)), true);
    assert.equal(hmacMatches('order_1|pay_1', secret, sign('order_1|pay_1', secret)), true);
  });

  it('rejects tampered bodies, wrong secrets and malformed input without throwing', () => {
    const good = sign(body, secret);
    assert.equal(hmacMatches(Buffer.from('{"event":"payment.captured" }'), secret, good), false);
    assert.equal(hmacMatches(body, 'other', good), false);
    assert.equal(hmacMatches(body, secret, ''), false);
    assert.equal(hmacMatches(body, '', good), false);
    assert.equal(hmacMatches(body, secret, 'not-hex'), false);
    assert.equal(hmacMatches(body, secret, good.slice(0, 10)), false);
    assert.equal(hmacMatches(body, secret, `${good}00`), false);
  });
});

describe('boost packs', () => {
  it('has unique ids, whole-rupee prices and bigger packs costing less per boost', async () => {
    const { BOOST_PACKS, BOOST_MS, findBoostPack } = await import('../../../constants/plans.js');
    assert.equal(new Set(BOOST_PACKS.map((p) => p.id)).size, BOOST_PACKS.length);
    const per = BOOST_PACKS.map((p) => p.amountPaise / p.credits);
    for (const p of BOOST_PACKS) assert.ok(p.amountPaise >= 100 && p.amountPaise % 100 === 0 && p.credits >= 1);
    for (let i = 1; i < per.length; i++) assert.ok(per[i] < per[i - 1]);
    assert.equal(BOOST_MS, 30 * 60_000);
    assert.equal(findBoostPack('boost5')?.credits, 5);
    assert.equal(findBoostPack('month'), undefined);
  });
});
