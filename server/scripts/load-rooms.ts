/**
 * load-rooms.ts — HUB_PLAN Phase 3a gate: N guest sockets on `/rooms`, one slug,
 * a fixed aggregate message rate. Prints ack-latency p50/p95/p99, an error-code
 * histogram, and exits non-zero when p95 > MAX_P95_MS or the error rate > 1%.
 *
 * LOCAL / STAGING ONLY. It floods a real room. Non-localhost URLs are refused
 * unless FORCE=true — never point it at production.
 *
 * Run (server up, rooms flag on, room seeded, e.g. `npm run seed:rooms`-style):
 *   SLUG=late-night npm run load:rooms
 *   URL=http://localhost:5000 SLUG=lobby SOCKETS=300 RATE=5 DURATION=60 npm run load:rooms
 *
 * Env: URL (http://localhost:5000) · SLUG (required) · SOCKETS (300) · RATE msgs/s,
 * aggregate (5) · DURATION s (60) · MAX_P95_MS (500) · FORCE (false).
 *
 * Expectations / caveats:
 * - Each socket carries a fresh `gid` + `anonId` cookie (the `/rooms` handshake
 *   needs only a UUID `gid`), so every socket is a distinct guest. Per-guest limits
 *   (slow mode 3 s, rate limiter) are respected by rotating through sockets, and a
 *   `retryAfterMs` rejection parks that socket until it elapses.
 * - Instances cap at the template hardCap (100 by default), so 300 sockets land in
 *   >= 3 instances of the same slug. Rooms with `hours` must be open; a room
 *   whose cap x instance limit is below SOCKETS will report join failures.
 * - First post per guest returns `challenge_required`; the arithmetic prompt is
 *   solved and the post retried. That extra round trip is not counted as an error.
 *   With Turnstile enabled on the server (TURNSTILE_* set) the script sends Cloudflare's
 *   dummy token 'XXXX.DUMMY.TOKEN.XXXX', which only verifies against Cloudflare's
 *   dummy secret (1x0000000000000000000000000000000AA) — use the TEST key pair.
 * - Text is varied (random words + counter) to dodge the duplicate check; automod
 *   may still reject some. Every non-ok final ack counts toward the error rate.
 * - Server memory is NOT measured here — watch the process separately.
 */
import { randomUUID } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';

type Ack = { ok: boolean; code?: string; retryAfterMs?: number; challenge?: { provider?: string; token?: string; prompt?: string } };
type Guest = { socket: Socket; nextAt: number; challenged: boolean };

const env = (name: string, fallback: string): string => process.env[name] ?? fallback;
const num = (name: string, fallback: number): number => {
  const n = Number(env(name, String(fallback)));
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} must be a positive number`);
  return n;
};

const URL_BASE = env('URL', 'http://localhost:5000').replace(/\/+$/, '');
const SLUG = env('SLUG', '');
const SOCKETS = num('SOCKETS', 300);
const RATE = num('RATE', 5);
const DURATION_MS = num('DURATION', 60) * 1000;
const MAX_P95_MS = num('MAX_P95_MS', 500);
const ACK_TIMEOUT_MS = 10_000;
const MAX_ERROR_RATE = 0.01;
const TURNSTILE_DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

const WORDS = ['coffee', 'night', 'music', 'rain', 'movie', 'sleep', 'train', 'book', 'walk', 'tea', 'code', 'moon', 'city', 'dream', 'cat', 'road'];
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)] as T;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const text = (i: number, n: number): string => `${pick(WORDS)} ${pick(WORDS)} ${i}-${n}-${Math.random().toString(36).slice(2, 7)}`;

const latencies: number[] = [];
const codes = new Map<string, number>();
let attempts = 0;
let failures = 0;
const bump = (code: string): void => void codes.set(code, (codes.get(code) ?? 0) + 1);

const emitAck = (socket: Socket, event: string, payload: unknown): Promise<Ack> =>
  new Promise((resolve) => {
    socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (err: Error | null, res?: Ack) => {
      resolve(err || !res ? { ok: false, code: 'timeout' } : res);
    });
  });

const connect = (): Promise<Guest | null> =>
  new Promise((resolve) => {
    const socket = io(`${URL_BASE}/rooms`, {
      transports: ['websocket'],
      reconnection: false,
      extraHeaders: { Cookie: `gid=${randomUUID()}; anonId=${randomUUID()}` },
    });
    socket.once('connect', () => resolve({ socket, nextAt: 0, challenged: false }));
    socket.once('connect_error', (err: Error & { data?: { code?: string } }) => {
      bump(`connect:${err.data?.code ?? 'error'}`);
      socket.close();
      resolve(null);
    });
  });

const join = async (guest: Guest, i: number): Promise<boolean> => {
  const res = await emitAck(guest.socket, 'ROOM_JOIN', { slug: SLUG, alias: `lt${i}x${Math.random().toString(36).slice(2, 6)}` });
  if (!res.ok) bump(`join:${res.code ?? 'unknown'}`);
  return res.ok;
};

/** One post, solving the first-post challenge if asked. Records latency + outcome. */
const post = async (guest: Guest, i: number, n: number): Promise<void> => {
  const body = text(i, n);
  const started = performance.now();
  let res = await emitAck(guest.socket, 'ROOM_MESSAGE', { text: body, id: `lt-${i}-${n}` });
  if (!res.ok && res.code === 'challenge_required' && res.challenge) {
    const { provider, token = '', prompt = '' } = res.challenge;
    const [a, b] = prompt.split('+').map((s) => Number(s.trim()));
    const answer =
      provider === 'turnstile'
        ? { provider, token: TURNSTILE_DUMMY_TOKEN }
        : { token, answer: String((a ?? 0) + (b ?? 0)) };
    res = await emitAck(guest.socket, 'ROOM_MESSAGE', { text: body, id: `lt-${i}-${n}`, challenge: answer });
    guest.challenged = true;
  }
  latencies.push(performance.now() - started);
  attempts += 1;
  if (res.ok) {
    bump('ok');
    return;
  }
  failures += 1;
  bump(res.code ?? 'unknown');
  if (res.retryAfterMs) guest.nextAt = Date.now() + res.retryAfterMs;
};

const percentile = (sorted: number[], p: number): number =>
  sorted.length ? (sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] as number) : 0;

const main = async (): Promise<number> => {
  if (!SLUG) throw new Error('SLUG is required (the room to join)');
  const { hostname } = new URL(URL_BASE);
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
  if (!local && process.env.FORCE !== 'true') {
    throw new Error(`Refusing non-localhost target ${hostname}. Local/staging only — set FORCE=true to override.`);
  }

  console.log(`Connecting ${SOCKETS} guests to ${URL_BASE}/rooms (slug=${SLUG}, ${RATE} msg/s, ${DURATION_MS / 1000}s)`);
  const guests: Guest[] = [];
  for (let i = 0; i < SOCKETS; i += 50) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(50, SOCKETS - i) }, async (_, k) => {
        const g = await connect();
        return g && (await join(g, i + k)) ? g : (g?.socket.close(), null);
      })
    );
    guests.push(...batch.filter((g): g is Guest => g !== null));
  }
  console.log(`Joined ${guests.length}/${SOCKETS}`);
  if (guests.length === 0) return 1;

  const counters = guests.map(() => 0);
  const inflight = new Set<Promise<void>>();
  const interval = 1000 / RATE;
  const start = Date.now();
  let cursor = 0;
  for (let tick = 0; Date.now() - start < DURATION_MS; tick += 1) {
    const due = start + tick * interval;
    // Next socket not parked by a retryAfterMs; if all are parked, skip this tick.
    for (let tries = 0; tries < guests.length; tries += 1) {
      const idx = (cursor + tries) % guests.length;
      const guest = guests[idx] as Guest;
      if (guest.nextAt > Date.now() || !guest.socket.connected) continue;
      cursor = idx + 1;
      const p = post(guest, idx, (counters[idx] = (counters[idx] ?? 0) + 1)).finally(() => inflight.delete(p));
      inflight.add(p);
      break;
    }
    await sleep(Math.max(0, due + interval - Date.now()));
  }
  await Promise.all(inflight);
  for (const g of guests) g.socket.close();

  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const errorRate = attempts ? failures / attempts : 1;
  console.log(`\nSent ${attempts} messages from ${guests.length} sockets`);
  console.log(`Ack latency ms  p50=${p50.toFixed(1)}  p95=${p95.toFixed(1)}  p99=${p99.toFixed(1)}`);
  console.log(`Error rate      ${(errorRate * 100).toFixed(2)}% (${failures}/${attempts})`);
  console.log('Outcomes        ', Object.fromEntries([...codes].sort((a, b) => b[1] - a[1])));

  const pass = p95 <= MAX_P95_MS && errorRate <= MAX_ERROR_RATE;
  console.log(pass ? '\nPASS' : `\nFAIL (p95 limit ${MAX_P95_MS} ms, error limit ${MAX_ERROR_RATE * 100}%)`);
  return pass ? 0 : 1;
};

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(2);
  }
);
