import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose, { Types } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { env } from '../../../config/env.js';
import { PendingConnection } from '../../../models/pendingConnection.js';
import * as pendingRepo from '../../../repositories/pendingConnection.js';
import { deleteClaim, peekClaim, saveClaim } from '../../match/claim.js';
import { issueConnectToken } from '../../match/connectToken.js';
import { skipUnlessRedis, useTestRedis } from '../../match/__tests__/redisHarness.js';
import type { ConnectionClaim } from '../../../types/connection.js';
import { completeConnection, completeConnectionWithClaim } from '../index.js';
import { cancelPending, listPendingForUser } from '../pending.js';

/**
 * Whisper-connection pending flows against real MongoDB + Redis: claim
 * redeem, token-path claim consumption, the pending list's spent-claim
 * filter, and the cancel status guard. Own throwaway database, dropped after.
 * Skips when either store is unreachable.
 */

const TEST_DB_NAME = 'whisperwave_test_connection';
let mongoUp = false;
const bothUp = (t: { skip: (why: string) => void }): void => {
  skipUnlessRedis(t);
  if (mongoUp) return;
  t.skip('MongoDB unavailable — skipping integration test');
  throw new Error('MongoDB unavailable');
};

useTestRedis();

before(async () => {
  if (process.env.NODE_ENV !== 'test') throw new Error('Refusing to run outside NODE_ENV=test');
  try {
    await mongoose.connect(env.DB_URI, { dbName: TEST_DB_NAME, serverSelectionTimeoutMS: 1500 });
    mongoUp = true;
  } catch (err) {
    mongoUp = false;
    await mongoose.disconnect().catch(() => undefined);
    console.warn(`[test] MongoDB unavailable (${err instanceof Error ? err.message : 'unknown'})`);
  }
});

after(async () => {
  if (!mongoUp) return;
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

const claimFor = (sessionId: string, seat: 0 | 1): ConnectionClaim => ({
  sessionId,
  seat,
  originNames: ['night_fox', 'blue_static'],
  originTags: [['music'], ['gaming']],
  createdAt: Date.now(),
});

const newUser = (): string => new Types.ObjectId().toString();

describe('connection pending flows (Mongo + Redis integration)', () => {
  it('claim redeem binds the seat, consumes the claim, and waits for the partner', async (t) => {
    bothUp(t);
    const [anonId, sessionId, user] = [uuid(), uuid(), newUser()];
    await saveClaim(anonId, claimFor(sessionId, 0));
    const { result, announce } = await completeConnectionWithClaim(sessionId, user, anonId);
    assert.equal(result.status, 'waiting_for_partner');
    assert.equal(announce, null);
    assert.equal(await peekClaim(anonId, sessionId), null);
    const items = await listPendingForUser(user, anonId);
    assert.deepStrictEqual(items.map((i) => i.state), ['waiting_for_partner']);
  });

  it('token path consumes the caller claim for the same session only', async (t) => {
    bothUp(t);
    const [anonId, sessionId, otherSession, user] = [uuid(), uuid(), uuid(), newUser()];
    await saveClaim(anonId, claimFor(sessionId, 1));
    await saveClaim(anonId, claimFor(otherSession, 0));
    try {
      const token = issueConnectToken({
        sessionId,
        side: 1,
        displayName: 'blue_static',
        partnerName: 'night_fox',
        vibeTags: ['gaming'],
        partnerTags: ['music'],
      });
      await completeConnection(token, user, anonId);
      assert.equal(await peekClaim(anonId, sessionId), null);
      assert.ok(await peekClaim(anonId, otherSession), 'other session claim must survive');
    } finally {
      await deleteClaim(anonId, otherSession);
    }
  });

  it('lists several claims per browser and hides + sweeps one whose seat is already bound', async (t) => {
    bothUp(t);
    const [anonId, s1, s2, user] = [uuid(), uuid(), uuid(), newUser()];
    await saveClaim(anonId, claimFor(s1, 0));
    await saveClaim(anonId, claimFor(s2, 0));
    try {
      const both = await listPendingForUser(user, anonId);
      assert.equal(both.filter((i) => i.state === 'action_needed').length, 2);

      const seats = claimFor(s1, 0);
      await pendingRepo.findOrCreate(s1, [
        { userId: null, displayName: seats.originNames[0], vibeTags: seats.originTags[0] },
        { userId: null, displayName: seats.originNames[1], vibeTags: seats.originTags[1] },
      ]);
      await pendingRepo.bindSideToUser(s1, 0, user);
      const remaining = await listPendingForUser(user, anonId);
      assert.ok(!remaining.some((i) => i.id === `claim:${s1}`), 'spent claim must be hidden');
      assert.ok(remaining.some((i) => i.id === `claim:${s2}`));
      assert.equal(await peekClaim(anonId, s1), null, 'spent claim must be swept');
    } finally {
      await deleteClaim(anonId, s1);
      await deleteClaim(anonId, s2);
    }
  });

  it('cancel only releases a seat on a pending row — never processing/completed', async (t) => {
    bothUp(t);
    const [sessionId, user] = [uuid(), newUser()];
    await pendingRepo.findOrCreate(sessionId, [
      { userId: null, displayName: 'a', vibeTags: [] },
      { userId: null, displayName: 'b', vibeTags: [] },
    ]);
    await pendingRepo.bindSideToUser(sessionId, 0, user);

    await pendingRepo.updateStatus(sessionId, 'processing');
    await assert.rejects(cancelPending(`pending:${sessionId}`, user, undefined), { statusCode: 404 });
    const row = await PendingConnection.findOne({ sessionId }).lean();
    assert.equal(row?.sides[0].userId?.toString(), user, 'seat must stay bound');

    await pendingRepo.updateStatus(sessionId, 'pending');
    await cancelPending(`pending:${sessionId}`, user, undefined);
    const released = await PendingConnection.findOne({ sessionId }).lean();
    assert.equal(released?.sides[0].userId, null);
  });
});
