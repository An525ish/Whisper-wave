/**
 * Dev-only partner simulator. Not imported by the app — run it by hand.
 *
 * Drives a second anonymous participant over the real `/anon` socket so a single
 * browser tab can be matched, messaged and made to leave. Two browser tabs can't
 * do this: the `anonId` cookie is httpOnly and shared, so both tabs resolve to
 * the same identity and `tryMatchFromQueue` filters the seeker against itself.
 *
 * Usage:
 *   node scripts/dev-partner.mjs          # match, exchange messages, type, exit
 *   node scripts/dev-partner.mjs leave    # same, then skip — drives the
 *                                         # partner-left flow
 *
 * Requires the API on :8080. Imports socket.io-client from node_modules, which
 * the client already depends on.
 */
import { io } from 'socket.io-client';

const BASE = 'http://localhost:8080';
const ALIAS = process.env.PARTNER_ALIAS ?? 'BlueStatic';
const EXIT_MS = Number(process.env.PARTNER_EXIT_MS ?? 22_000);
const TAGS = ['deep talks', 'music'];
const SCENARIO = process.argv[2] ?? 'chat';

const res = await fetch(`${BASE}/api/match/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    displayName: ALIAS,
    vibeTags: TAGS,
    gender: 'prefer_not_to_say',
    ageConfirmed: true,
  }),
});

if (!res.ok) {
  console.error('join failed', res.status, await res.text());
  process.exit(1);
}

const setCookie = res.headers.getSetCookie?.() ?? [];
const anonCookie = setCookie.find((c) => c.startsWith('anonId='))?.split(';')[0];
if (!anonCookie) {
  console.error('no anonId cookie in', setCookie);
  process.exit(1);
}
console.log('[partner] joined as', ALIAS, '|', anonCookie.split('=')[0] + '=***');

const socket = io(`${BASE}/anon`, {
  transports: ['websocket'],
  extraHeaders: { Cookie: anonCookie },
  timeout: 10_000,
});

socket.on('connect', () => console.log('[partner] socket connected'));
socket.on('connect_error', (e) => console.error('[partner] connect_error', e.message));
socket.on('QUEUE_JOINED', () => console.log('[partner] QUEUE_JOINED'));

socket.on('MATCH_FOUND', (p) => {
  // `partner` was flattened to `{ displayName, vibeTags }` in Phase D; the old
  // `p.partnerName` here logged `undefined` and read like a server bug.
  console.log('[partner] MATCH_FOUND partner =', p?.partner?.displayName, 'session =', p?.sessionId);
  setTimeout(() => say('hey — what are you listening to tonight?'), 800);
  setTimeout(() => say('i keep rotating between lo-fi and way too much post-rock'), 2200);
  setTimeout(() => say('anyway. hi. i am BlueStatic, before you ask.'), 3600);
  setTimeout(() => {
    socket.emit('ANON_TYPING_START', {});
    setTimeout(() => socket.emit('ANON_TYPING_STOP', {}), 2500);
  }, 5200);
  setTimeout(() => say('this is a decent conversation honestly'), 8000);

  if (SCENARIO === 'leave') {
    setTimeout(() => {
      console.log('[partner] leaving');
      socket.emit('ANON_NEXT', {});
    }, 11_000);
  }
});

socket.on('MATCH_MESSAGE', (m) => console.log('[partner] heard:', m?.content));
socket.on('MATCH_DISCONNECTED', (d) => console.log('[partner] DISCONNECTED', JSON.stringify(d)));
socket.on('MATCH_ERROR', (d) => console.error('[partner] MATCH_ERROR', JSON.stringify(d)));

function say(content) {
  socket.emit('ANON_MESSAGE', { content }, (ack) => {
    console.log('[partner] sent ack =', JSON.stringify(ack));
  });
}

// Hold the process open until the scenario finishes.
setTimeout(() => {
  socket.close();
  process.exit(0);
}, EXIT_MS);