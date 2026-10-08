import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Namespace } from 'socket.io';
import { getRedis } from '../../../config/redis.js';
import { MATCH_FOUND, QUEUE_JOINED, SESSION_EXPIRED } from '../../../constants/anon-events.js';
import { createSession, endSession } from '../../../services/match/session.js';
import { getWaitingCard } from '../../../services/match/index.js';
import { REDIS_KEYS } from '../../../services/match/keys.js';
import {
  skipUnlessRedis,
  useTestRedis,
} from '../../../services/match/__tests__/redisHarness.js';
import type { AnonSocket } from '../../../types/anonSocket.js';
import { isResumeHandshake } from '../auth.js';
import { handleAnonConnect } from '../handlers.js';

/**
 * Resume-only handshake (`auth: { resume: true }`) against real Redis.
 *
 * The contract under test is what it must NOT do: no enqueue, no card, no quota.
 */

const SESSIONS = ['resume-ok', 'resume-none'];
useTestRedis(async () => {
  for (const id of SESSIONS) await endSession(id).catch(() => undefined);
});

const fakeSocket = (anonId: string) => {
  const emitted: Array<{ event: string; payload?: unknown }> = [];
  const socket = {
    anonId,
    resumeOnly: true,
    sessionId: undefined as string | undefined,
    join: async () => undefined,
    emit: (event: string, payload?: unknown) => {
      emitted.push({ event, payload });
    },
  } as unknown as AnonSocket;
  return { socket, emitted };
};

const inQueue = async (anonId: string): Promise<boolean> =>
  (await getRedis().lrange(REDIS_KEYS.queue, 0, -1)).includes(anonId);

describe('isResumeHandshake', () => {
  it('accepts only a strict boolean true', () => {
    assert.equal(isResumeHandshake({ resume: true }), true);
    assert.equal(isResumeHandshake({ resume: 'true' }), false);
    assert.equal(isResumeHandshake({ resume: 1 }), false);
    assert.equal(isResumeHandshake({}), false);
    assert.equal(isResumeHandshake(undefined), false);
    assert.equal(isResumeHandshake(null), false);
  });
});

describe('resume-only anon connect (Redis integration)', () => {
  it('replays MATCH_FOUND for an active session and does not enqueue', async (t) => {
    skipUnlessRedis(t);
    await createSession({
      sessionId: 'resume-ok',
      anon1: 'resume-ok-a',
      anon2: 'resume-ok-b',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
    const { socket, emitted } = fakeSocket('resume-ok-a');

    await handleAnonConnect(socket, {} as Namespace);

    assert.deepEqual(
      emitted.map((e) => e.event),
      [MATCH_FOUND]
    );
    assert.equal((emitted[0]?.payload as { sessionId: string }).sessionId, 'resume-ok');
    assert.equal(await inQueue('resume-ok-a'), false);
  });

  it('emits SESSION_EXPIRED with no session and leaves queue and card untouched', async (t) => {
    skipUnlessRedis(t);
    const anonId = 'resume-none-a';
    const { socket, emitted } = fakeSocket(anonId);

    await handleAnonConnect(socket, {} as Namespace);

    assert.deepEqual(
      emitted.map((e) => e.event),
      [SESSION_EXPIRED]
    );
    assert.deepEqual(emitted[0]?.payload, { reason: 'no_session' });
    assert.ok(!emitted.some((e) => e.event === QUEUE_JOINED));
    assert.equal(await inQueue(anonId), false);
    assert.equal(await getWaitingCard(anonId), null, 'resume must never create a card');
  });
});
