import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRedis } from '../../../config/redis.js';
import { setIdentityAlias } from '../queue.js';
import { blockAnonId, findBlockedCandidates, isBlocked } from '../block.js';
import { createSession, endSession, getUserActiveSessions } from '../session.js';
import { REDIS_KEYS } from '../keys.js';
import { saveIdentityCard } from '../queueEntry.js';
import { skipUnlessRedis, useTestRedis } from './redisHarness.js';

/**
 * Blocking across BOTH identities, against real Redis.
 *
 * PARALLEL-SAFE BY DESIGN. Node's test runner runs test FILES concurrently and
 * they all share one Redis, so this file may only touch keys scoped to the
 * identities it creates. It must never read or write `match:queue:global` — that
 * one list is global to the whole app, and `queue.integration.test.ts` owns it.
 * Anything that genuinely needs the matcher (rather than the block check the
 * matcher calls) belongs in that file.
 */

useTestRedis();

/** Clear every key a test below owns, so a failed run cannot poison the next. */
const resetIdentities = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    await getRedis().del(REDIS_KEYS.blocked(id));
    await getRedis().del(REDIS_KEYS.identityAlias(id));
    await getRedis().del(REDIS_KEYS.userSessions(id));
    await getRedis().del(REDIS_KEYS.activeSession(id));
  }
};

describe('blocking across anonymous and signed-in identities', () => {
  it('skips a blocked candidate in both directions', async (t) => {
    skipUnlessRedis(t);
    const ids = ['blocker', 'blocked', 'third'];
    await resetIdentities(ids);
    await blockAnonId('blocker', 'blocked');
    await blockAnonId('blocked', 'blocker');

    const skipped = await findBlockedCandidates({ anonId: 'blocker' }, [
      { anonId: 'blocked' },
      { anonId: 'third' },
    ]);
    assert.ok(skipped.has('blocked'), 'the blocked candidate must be excluded');
    assert.ok(!skipped.has('third'), 'an unblocked candidate must not be excluded');

    await resetIdentities(ids);
  });

  /**
   * The regression this whole dual-key design exists to prevent.
   *
   * Someone is matched, reported and blocked while ANONYMOUS. They then sign in
   * and come back on a brand-new anonId. If a block were only ever an anonId
   * entry, that fresh anonId knows nothing about it and they are matched again —
   * so signing in would be a way to shed a block. The block must follow the
   * ACCOUNT.
   */
  it('a block survives the blocked person signing in on a fresh anonId', async (t) => {
    skipUnlessRedis(t);
    const USER = 'acct-victim';
    const VICTIM_OLD = 'victim-anon-1';
    const VICTIM_NEW = 'victim-anon-2';
    const BLOCKER = 'signer-blocker';
    const BLOCKER_USER = 'acct-blocker';
    const ids = [USER, VICTIM_OLD, VICTIM_NEW, BLOCKER, BLOCKER_USER];
    await resetIdentities(ids);

    // Both were signed in when the block was raised — the normal case for a
    // report, and the only point at which an account id exists to record.
    await setIdentityAlias(VICTIM_OLD, USER);
    await setIdentityAlias(BLOCKER, BLOCKER_USER);
    await blockAnonId(BLOCKER, VICTIM_OLD);

    // The victim signs out, loses their cookies and signs back in: new anonId,
    // same account. Nothing in the block mentions `VICTIM_NEW`.
    const skipped = await findBlockedCandidates(
      { anonId: BLOCKER, userId: BLOCKER_USER },
      [
        { anonId: VICTIM_NEW, userId: USER },
        { anonId: 'innocent-bystander' },
      ]
    );
    assert.ok(
      skipped.has(VICTIM_NEW),
      'a signed-in account shed its block by taking a fresh anonId'
    );
    assert.ok(
      !skipped.has('innocent-bystander'),
      'an unblocked candidate must still be matchable'
    );
    assert.equal(
      await isBlocked(
        { anonId: BLOCKER, userId: BLOCKER_USER },
        { anonId: VICTIM_NEW, userId: USER }
      ),
      true
    );

    await resetIdentities([...ids, 'innocent-bystander']);
  });

  it('does not treat an unblocked account as blocked', async (t) => {
    skipUnlessRedis(t);
    // Guards the test above: if EVERY signed-in pair read as blocked, that test
    // would pass while matching is broken for everyone.
    const ids = ['clean-a', 'clean-b', 'acct-clean-a', 'acct-clean-b'];
    await resetIdentities(ids);
    const skipped = await findBlockedCandidates(
      { anonId: 'clean-a', userId: 'acct-clean-a' },
      [{ anonId: 'clean-b', userId: 'acct-clean-b' }]
    );
    assert.equal(skipped.size, 0);
    assert.equal(
      await isBlocked(
        { anonId: 'clean-a', userId: 'acct-clean-a' },
        { anonId: 'clean-b', userId: 'acct-clean-b' }
      ),
      false
    );
    await resetIdentities(ids);
  });

  it('blocks on the anonId alone when neither side ever signed in', async (t) => {
    skipUnlessRedis(t);
    // The honest limit of "never persist anon data": if no account id existed when
    // the block was raised, there was nothing to attach it to, and the anonId is
    // the whole of what can be recorded.
    const ids = ['anon-only-a', 'anon-only-b'];
    await resetIdentities(ids);
    await blockAnonId('anon-only-a', 'anon-only-b');
    const skipped = await findBlockedCandidates({ anonId: 'anon-only-a' }, [
      { anonId: 'anon-only-b' },
    ]);
    assert.ok(skipped.has('anon-only-b'));
    await resetIdentities(ids);
  });
});

describe('per-account session index', () => {
  it('finds a match held under a different anonId, and only that', async (t) => {
    skipUnlessRedis(t);
    const u1 = 'idx-acct-one';
    const u2 = 'idx-acct-two';
    const ids = [u1, u2, 'idx-anon-one', 'idx-anon-two', 'idx-other'];
    await resetIdentities(ids);

    await createSession({
      sessionId: 'idx-session',
      anon1: 'idx-anon-one',
      anon2: 'idx-anon-two',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
      userId1: u1,
      userId2: u2,
    });

    // Same anonId: the normal cross-tab / reconnect case, not a conflict — the
    // caller resumes it before ever consulting the index.
    assert.deepEqual(await getUserActiveSessions(u1, 'idx-anon-one'), []);
    // A different anonId on the same account: this IS the conflict the index
    // exists to catch, and the anonId pointer alone cannot see it.
    assert.deepEqual(
      (await getUserActiveSessions(u1, 'idx-other')).map((s) => s.sessionId),
      ['idx-session']
    );

    await endSession('idx-session');
    await resetIdentities(ids);
  });

  it('forgets the account once the match ends', async (t) => {
    skipUnlessRedis(t);
    const u = 'idx-acct-gone';
    const ids = [u, 'idx-gone-a', 'idx-gone-b', 'idx-gone-other'];
    await resetIdentities(ids);

    await createSession({
      sessionId: 'idx-gone',
      anon1: 'idx-gone-a',
      anon2: 'idx-gone-b',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
      userId1: u,
    });
    assert.equal((await getUserActiveSessions(u, 'idx-gone-other')).length, 1);

    await endSession('idx-gone');
    // Or the account would read as "already in a whisper" until the TTL lapsed,
    // which is a support ticket nobody can fix.
    assert.deepEqual(await getUserActiveSessions(u, 'idx-gone-other'), []);
    await resetIdentities(ids);
  });
});

describe('second tab of one browser (same anonId)', () => {
  it('refuses to save a card while the anonId holds a live match, and allows it again after', async (t) => {
    skipUnlessRedis(t);
    const ids = ['tab-a', 'tab-b'];
    await resetIdentities(ids);
    const input = { displayName: 'second tab', vibeTags: [], gender: 'prefer_not_to_say' as const };

    await createSession({
      sessionId: 'tab-session',
      anon1: 'tab-a',
      anon2: 'tab-b',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });

    await assert.rejects(() => saveIdentityCard(input, 'tab-a'), {
      statusCode: 409,
    });

    // Once the chat ends the same browser may start a new one.
    await endSession('tab-session');
    const saved = await saveIdentityCard(input, 'tab-a');
    assert.equal(saved.anonId, 'tab-a');

    // A brand-new browser (no cookie) is never refused.
    const fresh = await saveIdentityCard(input, undefined);
    assert.equal(fresh.isNewIdentity, true);

    await getRedis().del(
      REDIS_KEYS.waiting('tab-a'),
      REDIS_KEYS.waiting(fresh.anonId),
      REDIS_KEYS.session('tab-session')
    );
    await resetIdentities(ids);
  });
});
