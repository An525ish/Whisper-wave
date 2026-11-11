import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import mongoose, { Types } from 'mongoose';

/**
 * Runs against a THROWAWAY Mongo only: set MONGO_TEST_URI (e.g. a local mongod).
 * Skipped otherwise, so `npm test` never touches a developer's real database.
 * Razorpay env is set before the service modules load (env is read at import).
 */
const URI = process.env.MONGO_TEST_URI;
// A complete env, or config/env.ts falls back to inert placeholders and ignores the Razorpay keys.
Object.assign(process.env, {
  DB_URI: URI ?? 'mongodb://localhost:27017/unused',
  ACCESS_TOKEN_SECRET: 'x'.repeat(32),
  ANON_JWT_SECRET: 'y'.repeat(32),
  R2_ACCOUNT_ID: 't', R2_ACCESS_KEY_ID: 't', R2_SECRET_ACCESS_KEY: 't', R2_BUCKET: 't',
  IMAGEKIT_URL_ENDPOINT: 'https://example.test',
  REDIS_URL: 'redis://localhost:6379',
});
process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'key_secret_for_tests';
process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret_for_tests';

const sign = (data: string | Buffer, secret: string) => createHmac('sha256', secret).update(data).digest('hex');

describe('payments (mongo)', { skip: !URI }, () => {
  let payments: typeof import('../index.js');
  let orderRepo: typeof import('../../../repositories/paymentOrder.js');
  let boostRepo: typeof import('../../../repositories/boostWallet.js');
  let subRepo: typeof import('../../../repositories/subscription.js');
  let entitlements: typeof import('../../user/entitlements.js');
  let User: typeof import('../../../models/user.js').User;

  const makeOrder = async (userId: string, planId: 'day' | 'month' | 'boost1' | 'boost5', orderId: string) => {
    const amount = { day: 1900, month: 9900, boost1: 900, boost5: 2900 }[planId];
    await orderRepo.create({ user: userId, planId, amountPaise: amount, currency: 'INR', razorpayOrderId: orderId });
    return amount;
  };

  const webhook = (event: string, orderId: string, paymentId: string, amount: number, secret?: string) => {
    const raw = Buffer.from(
      JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: orderId, amount, currency: 'INR' } } } })
    );
    return payments.handleWebhook(raw, sign(raw, secret ?? 'webhook_secret_for_tests'));
  };

  before(async () => {
    await mongoose.connect(URI!);
    payments = await import('../index.js');
    orderRepo = await import('../../../repositories/paymentOrder.js');
    boostRepo = await import('../../../repositories/boostWallet.js');
    subRepo = await import('../../../repositories/subscription.js');
    entitlements = await import('../../user/entitlements.js');
    ({ User } = await import('../../../models/user.js'));
    await mongoose.connection.dropDatabase();
  });

  after(async () => {
    await mongoose.connection.dropDatabase().catch(() => undefined);
    await mongoose.disconnect();
  });

  it('extends from now when new, and from the current expiry on early renewal', async () => {
    const uid = new Types.ObjectId().toString();
    const t0 = new Date('2026-01-01T00:00:00Z');
    const first = await subRepo.extend(uid, 'day', 86_400_000, 'admin', t0);
    assert.equal(first.expiresAt.toISOString(), '2026-01-02T00:00:00.000Z');
    // renew 12h later: time left is kept, not lost
    const second = await subRepo.extend(uid, 'week', 7 * 86_400_000, 'razorpay', new Date('2026-01-01T12:00:00Z'));
    assert.equal(second.expiresAt.toISOString(), '2026-01-09T00:00:00.000Z');
    assert.equal(second.planId, 'week');
    // lapsed pass restarts from now
    const third = await subRepo.extend(uid, 'day', 86_400_000, 'admin', new Date('2026-03-01T00:00:00Z'));
    assert.equal(third.expiresAt.toISOString(), '2026-03-02T00:00:00.000Z');
  });

  it('grants once even when the webhook is replayed and the browser confirms too', async () => {
    const uid = new Types.ObjectId().toString();
    const amount = await makeOrder(uid, 'month', 'order_replay');
    await webhook('payment.captured', 'order_replay', 'pay_1', amount);
    await webhook('payment.captured', 'order_replay', 'pay_1', amount);
    await webhook('order.paid', 'order_replay', 'pay_1', amount);
    const proof = {
      razorpay_order_id: 'order_replay',
      razorpay_payment_id: 'pay_1',
      razorpay_signature: sign('order_replay|pay_1', 'key_secret_for_tests'),
    };
    const ent = await payments.confirmCheckout(uid, proof);
    assert.equal(ent.pass.active, true);
    const sub = await subRepo.findByUser(uid);
    const days = (sub!.expiresAt.getTime() - Date.now()) / 86_400_000;
    assert.ok(days > 29.9 && days <= 30, `one month granted once, got ${days}`);
  });

  it('refuses a wrong amount, a bad signature, someone else\'s order and unknown orders', async () => {
    const uid = new Types.ObjectId().toString();
    const other = new Types.ObjectId().toString();
    await makeOrder(uid, 'month', 'order_guard');
    await webhook('payment.captured', 'order_guard', 'pay_x', 100); // paid 1 rupee
    assert.equal((await entitlements.getEntitlements(uid)).pass.active, false);

    await assert.rejects(() => webhook('payment.captured', 'order_guard', 'pay_x', 9900, 'wrong'), /Invalid signature/);
    await assert.rejects(() => payments.handleWebhook(undefined, 'sig'), /Invalid signature/);

    const proof = {
      razorpay_order_id: 'order_guard',
      razorpay_payment_id: 'pay_y',
      razorpay_signature: sign('order_guard|pay_y', 'key_secret_for_tests'),
    };
    await assert.rejects(() => payments.confirmCheckout(other, proof), /Order not found/);
    await assert.rejects(
      () => payments.confirmCheckout(uid, { ...proof, razorpay_signature: 'ab'.repeat(32) }),
      /verify that payment/
    );
    // unknown orders are ignored quietly (provider must stop retrying)
    await webhook('payment.captured', 'order_nope', 'pay_z', 9900);
    assert.equal((await entitlements.getEntitlements(uid)).pass.active, false);
  });

  it('lets a retry grant after a failed grant (order reverts to created)', async () => {
    const uid = new Types.ObjectId().toString();
    const amount = await makeOrder(uid, 'day', 'order_retry');
    const claimed = await orderRepo.markPaid('order_retry', 'pay_r');
    assert.ok(claimed);
    assert.equal(await orderRepo.markPaid('order_retry', 'pay_r'), null);
    await orderRepo.revertToCreated('order_retry');
    await webhook('payment.captured', 'order_retry', 'pay_r', amount);
    assert.equal((await entitlements.getEntitlements(uid)).pass.active, true);
  });

  it('boost packs add credits once, and a credit can only be spent once even when tapped twice', async () => {
    const uid = new Types.ObjectId().toString();
    const amount = await makeOrder(uid, 'boost1', 'order_b1');
    await webhook('payment.captured', 'order_b1', 'pay_b1', amount);
    await webhook('payment.captured', 'order_b1', 'pay_b1', amount); // replay
    assert.equal((await entitlements.getEntitlements(uid)).boost.credits, 1);
    assert.equal((await entitlements.getEntitlements(uid)).pass.active, false, 'a boost is not a pass');

    const five = await makeOrder(uid, 'boost5', 'order_b5');
    await webhook('payment.captured', 'order_b5', 'pay_b5', five);
    assert.equal((await entitlements.getEntitlements(uid)).boost.credits, 6);

    const solo = new Types.ObjectId().toString();
    await boostRepo.addCredits(solo, 1);
    const now = new Date('2026-01-01T00:00:00Z');
    const results = await Promise.all([boostRepo.spendOne(solo, 1_800_000, now), boostRepo.spendOne(solo, 1_800_000, now)]);
    assert.equal(results.filter(Boolean).length, 1, 'exactly one tap wins');
    const w = await boostRepo.findByUser(solo);
    assert.equal(w?.credits, 0);
    assert.equal(w?.activeUntil?.toISOString(), '2026-01-01T00:30:00.000Z');

    // stacking: a second boost starts when the first ends
    await boostRepo.addCredits(solo, 1);
    await boostRepo.spendOne(solo, 1_800_000, new Date('2026-01-01T00:10:00Z'));
    assert.equal((await boostRepo.findByUser(solo))?.activeUntil?.toISOString(), '2026-01-01T01:00:00.000Z');
    // refund puts the credit and the old end time back
    await boostRepo.refund(solo, new Date('2026-01-01T00:30:00Z'));
    const back = await boostRepo.findByUser(solo);
    assert.equal(back?.credits, 1);
    assert.equal(back?.activeUntil?.toISOString(), '2026-01-01T00:30:00.000Z');
  });

  it('admin grant and revoke, and hasPass follows', async () => {
    const user = await User.create({
      name: 'T', username: `t_${Date.now()}`, password: 'x', avatar: { publicId: 'a', url: 'https://example.test/a.png' },
    });
    const id = String(user._id);
    assert.equal(await entitlements.hasPass(id), false);
    await payments.adminGrant(id, 'week');
    assert.equal(await entitlements.hasPass(id), true);
    await payments.adminRevoke(id);
    assert.equal(await entitlements.hasPass(id), false);
    await assert.rejects(() => payments.adminGrant(new Types.ObjectId().toString(), 'day'), /User not found/);
    assert.equal(await entitlements.hasPass(undefined), false);
  });
});
