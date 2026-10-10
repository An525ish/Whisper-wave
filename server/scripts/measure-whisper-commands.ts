/**
 * measure-whisper-commands.ts
 *
 * Measures the real Redis command cost of one whisper session by driving a
 * synthetic 10-message mutual-like session through the production match
 * services while a MONITOR tap counts every command under the test prefix.
 *
 * What it runs (guest + guest, the common case):
 *   join  — A saves its identity card and enters the queue (no candidate yet)
 *   pair  — B saves its card and pairs with A (session created)
 *   chat  — 10 accepted messages, alternating sides, unique ids
 *   vibe  — one-sided like, then the mutual like (connectTokens minted)
 *   end   — session teardown
 *
 * What it does NOT count (socket-layer, not session cost):
 *   presence heartbeats/clears, socket rate-limiter checks, quota reads for
 *   signed-in users, reconnect replays. Those are per-connection, not
 *   per-session, and belong to a different budget line.
 *
 * Safety:
 *   - Refuses to run unless REDIS_KEY_PREFIX is set (test env default `test:`),
 *     so it can never touch a developer's live queue.
 *   - Local Redis only in practice (testFallback points at localhost); the
 *     MONITOR tap filters to the test prefix, so a running dev server's
 *     traffic is never counted.
 *   - Cleans up every key it writes.
 *
 * Run:
 *   cd server
 *   npm run measure:whisper          # NODE_ENV=test, prefix test:
 */
import { v4 as uuid } from 'uuid';
import net from 'node:net';
import { env } from '../src/config/env.js';
import { connectRedis, disconnectRedis, getRedis } from '../src/config/redis.js';
import { endSession, deleteSession } from '../src/services/match/session.js';
import {
  deleteWaitingCard,
  enqueue,
  purgeQueue,
  saveWaitingCard,
} from '../src/services/match/queue.js';
import { pairOrEnqueue } from '../src/services/match/pairing.js';
import { acceptAnonMessage } from '../src/services/match/messaging.js';
import { recordLike } from '../src/services/match/like.js';
import type { WaitingCard } from '../src/types/match.js';

const MESSAGE_COUNT = 10;

const LINES = [
  'hey, still awake?',
  'always at this hour honestly',
  'what keeps you up?',
  'overthinking a conversation from tuesday',
  'classic. replaying it word by word?',
  'word by word, yes. you?',
  'same but with playlists instead of people',
  'that sounds healthier than my version',
  'marginally. what are you listening to?',
  'something slow with too much reverb',
];

const card = (tags: string[]): WaitingCard => ({
  anonId: uuid(),
  displayName: `measure_${uuid().slice(0, 8)}`,
  vibeTags: tags,
  gender: 'prefer_not_to_say',
  joinedAt: Date.now(),
});

const main = async (): Promise<void> => {
  if (!env.REDIS_KEY_PREFIX) {
    throw new Error('REFUSING to run unprefixed — set REDIS_KEY_PREFIX (test env defaults to test:)');
  }

  await connectRedis(5000);
  const redis = getRedis();

  // Flush stale measurement keys from a killed run, BEFORE the tap starts.
  const stale: string[] = [];
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', `${env.REDIS_KEY_PREFIX}match:*`);
    cursor = next;
    stale.push(...keys);
  } while (cursor !== '0');
  if (stale.length > 0) await redis.del(...stale);

  // MONITOR tap over a raw socket: count every command touching our prefix.
  // (A raw tap, not ioredis `.monitor()` — 5.x resolves it without emitting,
  // and a raw stream gives full control. Pipelined commands arrive
  // individually, which is what we want since providers bill each one.)
  // Localhost only: no TLS on a raw socket.
  const redisUrl = new URL(env.REDIS_URL);
  if (redisUrl.protocol !== 'redis:') {
    throw new Error('measure:whisper targets local Redis only (plain redis://)');
  }
  const counts = new Map<string, number>();
  let total = 0;
  let buffer = '';
  const tap = net.createConnection({
    host: redisUrl.hostname,
    port: Number(redisUrl.port) || 6379,
  });
  await new Promise<void>((resolve, reject) => {
    tap.once('error', reject);
    tap.write('MONITOR\r\n');
    const onData = (chunk: Buffer): void => {
      buffer += chunk.toString('utf8');
      if (buffer.includes('+OK')) {
        tap.off('data', onData);
        resolve();
      }
    };
    tap.on('data', onData);
  });
  tap.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.includes(env.REDIS_KEY_PREFIX)) continue;
      // MONITOR line: `<ts> [db <addr>] "cmd" "arg" ...` — first quoted token wins.
      const found = line.match(/"([^"]+)"/);
      if (!found) continue;
      const cmd = (found[1] ?? 'unknown').toLowerCase();
      counts.set(cmd, (counts.get(cmd) ?? 0) + 1);
      total += 1;
    }
  });

  const phaseTotals = new Map<string, number>();
  const mark = (phase: string, before: number): void => {
    phaseTotals.set(phase, total - before);
    console.log(`[measure] ${phase}: ${total - before} cmds (total so far: ${total})`);
  };

  const cardA = card(['music', 'night']);
  const cardB = card(['music', 'gaming']);

  let before = total;
  await saveWaitingCard(cardA);
  await enqueue(cardA.anonId);
  const attemptA = await pairOrEnqueue(cardA);
  if (attemptA.paired) throw new Error('Expected A to enqueue, not pair (empty queue)');
  mark('join (1 guest: card + enqueue + match attempt)', before);

  before = total;
  await saveWaitingCard(cardB);
  await enqueue(cardB.anonId);
  const attemptB = await pairOrEnqueue(cardB);
  if (!attemptB.paired || !attemptB.sessionId) {
    throw new Error('Expected B to pair with A');
  }
  const sessionId = attemptB.sessionId;
  mark('pair (card + match + session create)', before);

  before = total;
  for (let i = 0; i < MESSAGE_COUNT; i += 1) {
    const fromA = i % 2 === 0;
    const res = await acceptAnonMessage(
      sessionId,
      fromA ? cardA.anonId : cardB.anonId,
      LINES[i] ?? `message ${i}`,
      `measure_msg_${i}`
    );
    if (!res.accepted) throw new Error(`Message ${i} rejected: ${res.reason}`);
  }
  mark(`chat (${MESSAGE_COUNT} accepted messages)`, before);

  before = total;
  const likeA = await recordLike(sessionId, cardA.anonId);
  if (likeA.type !== 'one_sided') throw new Error('Expected the first like to be one-sided');
  mark('vibe (one-sided like)', before);

  before = total;
  const likeB = await recordLike(sessionId, cardB.anonId);
  if (likeB.type !== 'mutual') throw new Error('Expected the second like to be mutual');
  mark('vibe (mutual like + connectTokens)', before);

  before = total;
  await endSession(sessionId);
  mark('end (session teardown)', before);

  tap.destroy();

  // Cleanup everything we wrote (outside the measurement window).
  await deleteWaitingCard(cardA.anonId).catch(() => undefined);
  await deleteWaitingCard(cardB.anonId).catch(() => undefined);
  await deleteSession(sessionId).catch(() => undefined);
  await purgeQueue().catch(() => undefined);
  await disconnectRedis();

  const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const phaseTotal = [...phaseTotals.values()].reduce((a, b) => a + b, 0);

  console.log('\nWhisper session Redis cost (10-message mutual-like session, guest+guest)');
  console.log('─'.repeat(72));
  for (const [phase, n] of phaseTotals) {
    console.log(`  ${String(n).padStart(4)}  ${phase}`);
  }
  console.log('─'.repeat(72));
  console.log(`  ${String(phaseTotal).padStart(4)}  TOTAL commands per session`);
  console.log(`  ${(phaseTotal / MESSAGE_COUNT).toFixed(1)}  commands per message (session amortized)`);
  console.log('\nBy command:');
  for (const [cmd, n] of ordered) {
    console.log(`  ${String(n).padStart(4)}  ${cmd}`);
  }
  console.log('');
  process.exit(0);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
