import { before, after } from 'node:test';
import { connectRedis, disconnectRedis } from '../../../config/redis.js';
import { env } from '../../../config/env.js';

/**
 * Shared Redis lifecycle for the match integration suites.
 *
 * SAFETY: the suites refuse to run unless `REDIS_KEY_PREFIX` is set, and the
 * test env default is `test:`. They `del` queue and state keys, so running them
 * against an unprefixed Redis would wipe a developer's live queue and every queued
 * user's 24 h identity card. If Redis isn't reachable the suites skip instead.
 *
 * Factored out because the reaction and quota suites were growing their own copy
 * of this — and a second copy that quietly forgot the prefix guard would be worse
 * than no guard at all.
 */

export let redisUp = false;

const INTEGRATION_SKIP_REASON =
  'Redis unavailable or unprefixed — skipping integration test';

/**
 * Skip an integration test when Redis is unusable.
 *
 * Resolved at RUN time, not registration time. These tests were previously
 * `it(name, { skip: skip() }, fn)`, but Node's runner registers `it()`
 * synchronously inside `describe()`, so that call evaluated `redisUp` BEFORE the
 * `before()` hook had run — every integration test was therefore skipped
 * unconditionally, Redis up or not, and had in fact never executed. `t.skip()` is
 * reached only once the test body starts, which is after `before()` has had its
 * chance to connect.
 */
export const skipUnlessRedis = (t: { skip: (why: string) => void }): void => {
  if (!redisUp) t.skip(INTEGRATION_SKIP_REASON);
};

/** A minimal identity card, matching what `joinQueue` writes. */
export const card = (anonId: string, tags: string[] = []) => ({
  anonId,
  displayName: `alias-${anonId}`,
  vibeTags: tags,
  gender: 'prefer_not_to_say' as const,
  joinedAt: Date.now(),
});

/**
 * Connect for a suite, and close the connection once the suite is done.
 *
 * Node's test runner gives each test FILE its own process and runs the files
 * CONCURRENTLY against one Redis, so this is per-file. It deliberately does NOT
 * clean up keys itself: a shared cleanup would run while a sibling file is still
 * using that key, and the resulting failure would look like a bug in the code
 * under test. Each file owns — and cleans — the keys it writes, via `cleanup`.
 *
 * `cleanup` MUST run before the disconnect. Calling `getRedis()` after it
 * lazily creates a fresh, never-connected client, and the first command on that
 * hangs forever rather than failing.
 */
export const useTestRedis = (cleanup?: () => Promise<void>): void => {
  before(async () => {
    if (!env.REDIS_KEY_PREFIX) {
      console.warn(
        '[test] REDIS_KEY_PREFIX is empty — refusing to run destructive integration tests'
      );
      return;
    }
    try {
      // Short timeout — a missing Redis must skip the suite, not hang the run.
      await connectRedis(3000);
      redisUp = true;
    } catch (err) {
      redisUp = false;
      console.warn(
        `[test] Redis unavailable (${err instanceof Error ? err.message : 'unknown'}) — skipping integration tests`
      );
    }
  });

  after(async () => {
    if (!redisUp) return;
    if (cleanup) await cleanup();
    await disconnectRedis();
  });
};
