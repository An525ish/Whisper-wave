import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRedis } from '../../../config/redis.js';
import { createSession, endSession } from '../session.js';
import { applyAnonReaction, getMessageReactions, getSessionReactions } from '../reaction.js';
import { REDIS_KEYS } from '../keys.js';
import { bufferTestMessage, skipUnlessRedis, useTestRedis } from './redisHarness.js';

/**
 * Vibe reactions against real Redis.
 *
 * These pin the toggle semantics and the refusals — the parts where a subtle bug
 * is invisible in the type checker and shows up as a user's reaction silently
 * doing the wrong thing.
 */

useTestRedis();

const MSG = 'msg-1';

/**
 * A fresh session AND a fresh reaction set.
 *
 * Both keys must be cleared, and that is not fussiness. Reactions live in their
 * own SET, not inside the message buffer, so a run that only reset the buffer
 * would find the previous run's reactions still on the message — and since a
 * repeat reaction *toggles*, the leftover entry would silently un-react on the
 * second run and the test would pass or fail depending on what ran before it.
 */
const reactionSession = async (id: string): Promise<void> => {
  await getRedis().del(REDIS_KEYS.messages(id));
  await getRedis().del(REDIS_KEYS.meta(id));
  await getRedis().del(REDIS_KEYS.reactions(id, MSG));
  await createSession({
    sessionId: id,
    anon1: `${id}-a`,
    anon2: `${id}-b`,
    name1: 'one',
    name2: 'two',
    tags1: [],
    tags2: [],
  });
};

describe('vibe reactions (Redis integration)', () => {
  it('adds a reaction and reports who left it', async (t) => {
    skipUnlessRedis(t);
    await reactionSession('react-add');
    await bufferTestMessage('react-add', { id: MSG, from: 'react-add-a', content: 'hi', sentAt: 1 });

    const result = await applyAnonReaction('react-add', 'react-add-a', MSG, 'fire');
    assert.equal(result.action, 'added');
    assert.equal(result.reaction, 'fire');
    assert.equal(result.anonId, 'react-add-a');
    assert.equal(result.partnerAnonId, 'react-add-b');

    assert.deepEqual(await getMessageReactions('react-add', MSG), { 'react-add-a': ['fire'] });
  });

  it('toggles the same reaction off', async (t) => {
    skipUnlessRedis(t);
    await reactionSession('react-toggle');
    await bufferTestMessage('react-toggle', { id: MSG, from: 'react-toggle-a', content: 'hi', sentAt: 1 });

    await applyAnonReaction('react-toggle', 'react-toggle-a', MSG, 'fire');
    const second = await applyAnonReaction('react-toggle', 'react-toggle-a', MSG, 'fire');
    assert.equal(second.action, 'removed', 're-sending the same reaction should remove it');
    assert.deepEqual(await getMessageReactions('react-toggle', MSG), {});
  });

  it('lets one person hold only one reaction per message', async (t) => {
    skipUnlessRedis(t);
    await reactionSession('react-replace');
    await bufferTestMessage('react-replace', { id: MSG, from: 'react-replace-a', content: 'hi', sentAt: 1 });

    await applyAnonReaction('react-replace', 'react-replace-a', MSG, 'fire');
    await applyAnonReaction('react-replace', 'react-replace-a', MSG, 'slay');
    assert.deepEqual(
      await getMessageReactions('react-replace', MSG),
      { 'react-replace-a': ['slay'] },
      'changing reaction should replace, not accumulate'
    );
  });

  it('keeps two people on one message apart', async (t) => {
    skipUnlessRedis(t);
    await reactionSession('react-two');
    await bufferTestMessage('react-two', { id: MSG, from: 'react-two-a', content: 'hi', sentAt: 1 });

    await applyAnonReaction('react-two', 'react-two-a', MSG, 'fire');
    await applyAnonReaction('react-two', 'react-two-b', MSG, 'peak');
    assert.deepEqual(await getMessageReactions('react-two', MSG), {
      'react-two-a': ['fire'],
      'react-two-b': ['peak'],
    });
  });

  it('reports reactions relative to the viewer, never as an anonId', async (t) => {
    skipUnlessRedis(t);
    await reactionSession('react-side');
    const message = { id: MSG, from: 'react-side-a', content: 'hi', sentAt: 1 };
    await bufferTestMessage('react-side', message);
    await applyAnonReaction('react-side', 'react-side-a', MSG, 'fire');
    await applyAnonReaction('react-side', 'react-side-b', MSG, 'peak');

    const forA = await getSessionReactions('react-side', [message], 'react-side-a');
    const forB = await getSessionReactions('react-side', [message], 'react-side-b');
    assert.deepEqual(forA[MSG], { me: ['fire'], them: ['peak'] });
    assert.deepEqual(forB[MSG], { me: ['peak'], them: ['fire'] });
    assert.equal(JSON.stringify(forA).includes('react-side-'), false, 'an anonId leaked');
  });

  it('deletes a thread\'s reactions when the session ends', async (t) => {
    skipUnlessRedis(t);
    await reactionSession('react-end');
    await bufferTestMessage('react-end', { id: MSG, from: 'react-end-a', content: 'hi', sentAt: 1 });
    await applyAnonReaction('react-end', 'react-end-a', MSG, 'fire');
    assert.equal(await getRedis().exists(REDIS_KEYS.reactions('react-end', MSG)), 1);

    await endSession('react-end');
    assert.equal(
      await getRedis().exists(REDIS_KEYS.reactions('react-end', MSG)),
      0,
      'a transcript must not outlive its session'
    );
  });

  it('refuses a reaction on a message that is not in the buffer', async (t) => {
    skipUnlessRedis(t);
    // Accepting this would let anyone mint reaction keys for ids that never
    // existed, and would silently drop a reaction whose bubble the partner never
    // sees.
    await reactionSession('react-missing');
    await assert.rejects(
      () => applyAnonReaction('react-missing', 'react-missing-a', 'never-sent', 'fire'),
      /not in this chat/
    );
    assert.equal(
      await getRedis().exists(REDIS_KEYS.reactions('react-missing', 'never-sent')),
      0,
      'a refused reaction must not create a key'
    );
  });

  it('refuses reactions from a dead session', async (t) => {
    skipUnlessRedis(t);
    await reactionSession('react-dead');
    await endSession('react-dead');
    await assert.rejects(
      () => applyAnonReaction('react-dead', 'react-dead-a', MSG, 'fire'),
      /no longer active/i
    );
  });

  it('refuses reactions from a non-participant', async (t) => {
    skipUnlessRedis(t);
    await reactionSession('react-outsider');
    await bufferTestMessage('react-outsider', { id: MSG, from: 'react-outsider-a', content: 'hi', sentAt: 1 });
    await assert.rejects(
      () => applyAnonReaction('react-outsider', 'someone-else', MSG, 'fire'),
      /not found or expired/i
    );
  });

  it('bounds a reaction set to the TTL, so it cannot outlive the thread', async (t) => {
    skipUnlessRedis(t);
    await reactionSession('react-ttl');
    await bufferTestMessage('react-ttl', { id: MSG, from: 'react-ttl-a', content: 'hi', sentAt: 1 });
    await applyAnonReaction('react-ttl', 'react-ttl-a', MSG, 'fire');

    // Reactions are private-thread data; an unexpiring key would hold a
    // conversation's contents indefinitely.
    const ttl = await getRedis().ttl(REDIS_KEYS.reactions('react-ttl', MSG));
    assert.ok(ttl > 0, `expected a TTL on the reaction set, got ${ttl}`);
  });
});
