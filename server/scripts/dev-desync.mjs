// DEV ONLY — never run against production Redis. Hard-codes localhost:6379 and mutates live match state.
/**
 * Dev-only fault injector. Flips a live match's server-side status to `ending`
 * WITHOUT emitting MATCH_DISCONNECTED — reproducing the desync where the client
 * still believes it is chatting.
 *
 * The client must then discover the session is dead on its own (from the
 * `session_ended` code on the next send / socket error) and offer the
 * find-someone prompt, rather than leaving the user in a chat that can never
 * deliver another message.
 *
 * Usage: node scripts/dev-desync.mjs          (report only)
 *        node scripts/dev-desync.mjs --flip   (apply)
 */
import Redis from 'ioredis';

const FLIP = process.argv.includes('--flip');
const r = new Redis({ host: 'localhost', port: 6379 });

const sessions = (await r.keys('match:session:*')).filter((k) => !k.startsWith('test:'));
if (sessions.length === 0) {
  console.log('[desync] no live sessions');
  process.exit(0);
}

for (const key of sessions) {
  const raw = await r.get(key);
  if (!raw) continue;
  const session = JSON.parse(raw);
  console.log(
    `[desync] ${session.sessionId} status=${session.status} ` +
      `${session.name1} <-> ${session.name2}`
  );
  if (!FLIP || session.status !== 'active') continue;
  await r.set(key, JSON.stringify({ ...session, status: 'ending' }));
  console.log(`[desync] flipped ${session.sessionId} -> ending (no notify sent)`);
}

await r.quit();
process.exit(0);