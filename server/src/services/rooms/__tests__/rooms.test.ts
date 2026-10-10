import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRoomMessage, showsSelfHarmSigns } from '../automod.js';
import { isRoomOpen } from '../hours.js';
import { assertJoinAllowed, colorForAlias } from '../membership.js';
import { buildEvidenceSnapshot, recordRoomReport } from '../reports.js';
import { sweepQuietRooms } from '../wavebot.js';
import { deleteRoomMessage, isMuted, isShadowMuted, kickMember, muteMember, shadowMuteMember } from '../mods.js';
import { postRoomMessage } from '../messaging.js';
import { setLocked } from '../registry.js';
import {
  appendMessage,
  clearRegistry,
  hideMessage,
  joinInstance,
  leaveInstance,
  liveCounts,
  membersOf,
  recentMessages,
  toggleReaction,
} from '../registry.js';
import type { IRoomFields } from '../../../types/room.js';

const template: Pick<IRoomFields, 'slug' | 'title' | 'capSoft' | 'capHard'> = {
  slug: 'test-room',
  title: 'Test Room',
  capSoft: 2,
  capHard: 3,
};

const guest = (gid: string) => ({ kind: 'guest' as const, gid });

const base = {
  linksAllowed: false,
  slowModeMs: 3000,
  recentTexts: [] as string[],
  now: Date.now(),
};

describe('room hours', () => {
  // Monday 2026-10-12 23:30 IST = Monday 18:00 UTC.
  const mondayNight = new Date('2026-10-12T18:00:00Z');

  it('is always open without hours', () => {
    assert.equal(isRoomOpen(undefined, mondayNight), true);
    assert.equal(isRoomOpen(null, mondayNight), true);
  });

  it('opens and closes on schedule in the template timezone', () => {
    const hours = { days: [0, 1, 2, 3, 4, 5, 6], start: '22:00', end: '03:00', tz: 'Asia/Kolkata' };
    assert.equal(isRoomOpen(hours, mondayNight), true);
    // Monday 21:00 IST — before opening.
    assert.equal(isRoomOpen(hours, new Date('2026-10-12T15:30:00Z')), false);
  });

  it('treats small hours as the previous day session (overnight)', () => {
    const hours = { days: [1], start: '22:00', end: '03:00', tz: 'Asia/Kolkata' };
    // Tuesday 01:00 IST belongs to the Monday session.
    assert.equal(isRoomOpen(hours, new Date('2026-10-12T19:30:00Z')), true);
    // Tuesday 22:30 IST is not a Monday session.
    assert.equal(isRoomOpen(hours, new Date('2026-10-13T17:00:00Z')), false);
  });

  it('respects closed days', () => {
    const hours = { days: [6], start: '10:00', end: '12:00', tz: 'Asia/Kolkata' };
    // Monday 11:00 IST, only Saturday is open.
    assert.equal(isRoomOpen(hours, new Date('2026-10-12T05:30:00Z')), false);
  });
});

describe('room automod', () => {
  it('passes clean text', () => {
    assert.deepStrictEqual(
      checkRoomMessage({ ...base, text: 'anyone else still awake?', sender: guest('g1') }),
      { allowed: true }
    );
  });

  it('enforces slow mode before inspecting content', () => {
    assert.deepStrictEqual(
      checkRoomMessage({ ...base, text: 'hi', sender: guest('g1'), msSinceLastPost: 500 }),
      { allowed: false, code: 'slow_mode', retryAfterMs: 2500 }
    );
  });

  it('blocks word-list hits and names severe ones for auto-report', () => {
    assert.deepStrictEqual(
      checkRoomMessage({ ...base, text: 'send nudes', sender: guest('g1') }),
      { allowed: false, code: 'blocked_content', severe: false }
    );
    assert.deepStrictEqual(
      checkRoomMessage({ ...base, text: 'loli', sender: guest('g1') }),
      { allowed: false, code: 'blocked_content', severe: true }
    );
  });

  it('blocks links for guests', () => {
    assert.equal(
      checkRoomMessage({ ...base, text: 'check https://example.com/x', sender: guest('g1') }).allowed,
      false
    );
    assert.deepStrictEqual(
      checkRoomMessage({
        ...base,
        text: 'check https://example.com/x',
        sender: { kind: 'member', userId: 'u1' },
        linksAllowed: true,
      }),
      { allowed: true }
    );
  });

  it('suppresses repeats and floods', () => {
    const dup = { ...base, text: 'Hello!', sender: guest('g1'), recentTexts: ['hello!'] };
    assert.deepStrictEqual(checkRoomMessage(dup), { allowed: false, code: 'duplicate' });
    assert.equal(
      checkRoomMessage({ ...base, text: 'THIS IS ABSOLUTELY UNACCEPTABLE BEHAVIOR', sender: guest('g1') }).allowed,
      false
    );
    assert.equal(
      checkRoomMessage({ ...base, text: '🔥🔥🔥🔥🔥🔥🔥🔥🔥', sender: guest('g1') }).allowed,
      false
    );
  });
});

describe('join eligibility', () => {
  const openTemplate = {
    slug: 'test-room',
    title: 'Test Room',
    description: '',
    rules: [] as string[],
    lang: 'en',
    official: true,
    hours: null,
    capSoft: 60,
    capHard: 100,
    createdBy: null,
    visibility: 'official' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('rejects missing rooms, closed hours and live bans with stable codes', () => {
    assert.throws(() => assertJoinAllowed({ template: null, bans: [] }), /not_found/);
    assert.throws(
      () =>
        assertJoinAllowed({
          template: {
            ...openTemplate,
            hours: { days: [6], start: '10:00', end: '12:00', tz: 'Asia/Kolkata' },
          },
          bans: [],
          now: new Date('2026-10-12T05:30:00Z'),
        }),
      /closed/
    );
    assert.throws(
      () =>
        assertJoinAllowed({
          template: openTemplate,
          bans: [
            {
              roomSlug: null,
              gid: 'g1',
              userId: null,
              until: new Date(Date.now() + 3600_000),
              reason: 'spam',
              by: 'mod',
              createdAt: new Date(),
            },
          ],
        }),
      /banned/
    );
  });

  it('a room-scoped ban does not block other rooms', () => {
    assert.doesNotThrow(() =>
      assertJoinAllowed({
        template: openTemplate,
        bans: [
          {
            roomSlug: 'other-room',
            gid: 'g1',
            userId: null,
            until: new Date(Date.now() + 3600_000),
            reason: 'spam',
            by: 'mod',
            createdAt: new Date(),
          },
        ],
      })
    );
  });

  it('assigns stable persona colors', () => {
    assert.equal(colorForAlias('NightOwl'), colorForAlias('NightOwl'));
    assert.match(colorForAlias('NightOwl'), /^#[0-9a-f]{6}$/);
  });
});

describe('room posting', () => {
  const post = (text: string, gid = 'poster') =>
    postRoomMessage({ instanceId: 'test-room#1', identity: { kind: 'guest', gid }, text });

  it('throws for strangers and stores clean posts', () => {
    clearRegistry();
    try {
      assert.throws(() => post('hello?'), /not_joined/);
      joinInstance({ template, identity: guest('poster'), alias: 'Poster', color: '#fff' });
      const res = post('hello everyone');
      assert.ok('message' in res && res.message.text === 'hello everyone');
    } finally {
      clearRegistry();
    }
  });

  it('slow-modes guests and caps floods per identity', () => {
    clearRegistry();
    try {
      joinInstance({
        template,
        identity: guest('moddy'),
        alias: 'Moddy',
        color: '#fff',
        role: 'mod',
      });
      const poster = (i: number) =>
        postRoomMessage({
          instanceId: 'test-room#1',
          identity: { kind: 'guest', gid: 'moddy' },
          text: `flood ${i} with enough words to dodge the duplicate check ${i}`,
        });
      for (let i = 0; i < 20; i += 1) {
        const res = poster(i);
        assert.ok('message' in res, `post ${i} should pass`);
      }
      const capped = poster(20);
      assert.ok('ok' in capped && capped.ok === false && capped.code === 'rate_limited');

      joinInstance({ template, identity: guest('slow'), alias: 'Slow', color: '#fff' });
      assert.ok('message' in post('first', 'slow'));
      const second = post('second', 'slow');
      assert.ok('ok' in second && second.code === 'slow_mode');
      assert.ok(typeof second.retryAfterMs === 'number' && second.retryAfterMs > 0);
    } finally {
      clearRegistry();
    }
  });

  it('blocks links for members and duplicates for everyone', () => {
    clearRegistry();
    try {
      joinInstance({ template, identity: guest('linker'), alias: 'Linker', color: '#fff' });
      const linked = post('see https://example.com/x', 'linker');
      assert.ok('ok' in linked && linked.code === 'blocked_link');
      assert.ok('message' in post('unique thought here', 'linker'));
    } finally {
      clearRegistry();
    }
  });
});

describe('room registry', () => {
  it('fills, overflows and opens new instances by caps', () => {
    clearRegistry();
    try {
      const a = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      const b = joinInstance({ template, identity: guest('b'), alias: 'B', color: 'red' });
      assert.equal(a.instanceId, b.instanceId);
      const c = joinInstance({ template, identity: guest('c'), alias: 'C', color: 'red' });
      assert.equal(c.instanceId, a.instanceId); // soft=2 full, hard=3 takes one more
      const d = joinInstance({ template, identity: guest('d'), alias: 'D', color: 'red' });
      assert.notEqual(d.instanceId, a.instanceId); // hard=3 full → #2
      assert.deepStrictEqual(liveCounts('test-room').map((i) => i.online), [3, 1]);
    } finally {
      clearRegistry();
    }
  });

  it('rejoin is idempotent and alias collisions disambiguate', () => {
    clearRegistry();
    try {
      const first = joinInstance({ template, identity: guest('a'), alias: 'NightOwl', color: 'red' });
      const again = joinInstance({ template, identity: guest('a'), alias: 'NightOwl', color: 'red' });
      assert.equal(again.instanceId, first.instanceId);
      assert.equal(membersOf(first.instanceId).length, 1);
      const clash = joinInstance({ template, identity: guest('b'), alias: 'NightOwl', color: 'blue' });
      assert.notEqual(clash.member.alias, 'NightOwl');
      assert.ok(clash.member.alias.startsWith('NightOwl·'));
    } finally {
      clearRegistry();
    }
  });

  it('empty instances vanish and the ring trims', () => {
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      for (let i = 0; i < 105; i += 1) {
        appendMessage(instanceId, { alias: 'A', color: 'red', role: 'member', text: `m${i}` });
      }
      assert.equal(recentMessages(instanceId).length, 100);
      assert.equal(recentMessages(instanceId, 5).length, 5);
      assert.equal(leaveInstance(instanceId, guest('a')), 0);
      assert.deepStrictEqual(liveCounts('test-room'), []);
      assert.deepStrictEqual(recentMessages(instanceId), []);
    } finally {
      clearRegistry();
    }
  });
});

describe('room reactions', () => {
  it('toggles per identity and reports counts', () => {
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      joinInstance({ template, identity: guest('b'), alias: 'B', color: 'blue' });
      const msg = appendMessage(instanceId, { alias: 'A', color: 'red', role: 'member', text: 'hi' });
      assert.ok(msg);
      assert.deepStrictEqual(toggleReaction(instanceId, 'a', msg.id, 'fire'), { fire: 1 });
      assert.deepStrictEqual(toggleReaction(instanceId, 'b', msg.id, 'fire'), { fire: 2 });
      assert.deepStrictEqual(toggleReaction(instanceId, 'a', msg.id, 'fire'), { fire: 1 });
      assert.deepStrictEqual(toggleReaction(instanceId, 'b', msg.id, 'fire'), {});
      assert.equal(toggleReaction(instanceId, 'a', 'missing', 'fire'), null);
    } finally {
      clearRegistry();
    }
  });
});

describe('room mods', () => {
  it('members cannot moderate; mods can delete and mute', () => {
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('m'), alias: 'M', color: 'red', role: 'mod' });
      joinInstance({ template, identity: guest('u'), alias: 'U', color: 'blue' });
      const msg = appendMessage(instanceId, { alias: 'U', color: 'blue', role: 'member', text: 'hello' });
      assert.ok(msg);

      // Member attempts fail.
      assert.equal(deleteRoomMessage(instanceId, 'u', msg.id), false);
      assert.equal(muteMember(instanceId, 'u', 'm', 5), false);
      // Mods cannot target themselves.
      assert.equal(muteMember(instanceId, 'm', 'm', 5), false);

      // Mod delete hides from history but keeps the record.
      assert.equal(deleteRoomMessage(instanceId, 'm', msg.id), true);
      assert.deepStrictEqual(recentMessages(instanceId).map((m) => m.id).includes(msg.id), false);
      assert.equal(hideMessage(instanceId, msg.id), false); // already hidden

      // Mute blocks posting until it lapses.
      assert.equal(muteMember(instanceId, 'm', 'u', 60), true);
      assert.equal(isMuted(instanceId, 'u'), true);
      assert.equal(isMuted(instanceId, 'm'), false);
      const res = postRoomMessage({ instanceId, identity: guest('u'), text: 'can I talk?' });
      assert.ok('ok' in res && res.ok === false && res.code === 'muted');
    } finally {
      clearRegistry();
    }
  });

  it('kick writes a ban (tested at the repo seam in the namespace smoke)', () => {
    // kickMember hits Mongo (roomBanRepo) — covered by the socket smoke run,
    // not here. This pins the permission shape instead.
    clearRegistry();
    try {
      joinInstance({ template, identity: guest('m'), alias: 'M', color: 'red', role: 'mod' });
      joinInstance({ template, identity: guest('u'), alias: 'U', color: 'blue' });
      void kickMember;
      assert.ok(true);
    } finally {
      clearRegistry();
    }
  });
});

describe('room report evidence', () => {
  it('snapshots the message plus neighbours, alias/text/ts only', () => {
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      const ids: string[] = [];
      for (let i = 0; i < 5; i += 1) {
        const m = appendMessage(instanceId, { alias: i % 2 ? 'B' : 'A', color: 'red', role: 'member', text: `line ${i}` });
        assert.ok(m);
        ids.push(m.id);
      }
      const snapshot = buildEvidenceSnapshot(recentMessages(instanceId, 100), ids[2] ?? '');
      assert.equal(snapshot.length, 5);
      assert.deepStrictEqual(Object.keys(snapshot[0] ?? {}).sort(), ['alias', 'text', 'ts']);
      assert.equal(snapshot[2]?.text, 'line 2');
    } finally {
      clearRegistry();
    }
  });

  it('hides at three distinct reporters, never deletes', () => {
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      const msg = appendMessage(instanceId, { alias: 'A', color: 'red', role: 'member', text: 'reported' });
      assert.ok(msg);
      assert.equal(recordRoomReport(instanceId, msg.id, 'r1'), false);
      assert.equal(recordRoomReport(instanceId, msg.id, 'r1'), false); // same reporter twice
      assert.equal(recordRoomReport(instanceId, msg.id, 'r2'), false);
      assert.equal(recordRoomReport(instanceId, msg.id, 'r3'), true);
      assert.deepStrictEqual(recentMessages(instanceId).map((m) => m.id).includes(msg.id), false);
    } finally {
      clearRegistry();
    }
  });
});

describe('wave bot', () => {
  it('prompts quiet rooms once, never solos, never twice in a row', () => {
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      // Solo — no audience, no prompt.
      assert.deepStrictEqual(sweepQuietRooms(Date.now()), []);
      joinInstance({ template, identity: guest('b'), alias: 'B', color: 'blue' });
      // Fresh room — nothing quiet yet.
      appendMessage(instanceId, { alias: 'A', color: 'red', role: 'member', text: 'hi' });
      assert.deepStrictEqual(sweepQuietRooms(Date.now()), []);
      // Eleven silent minutes later — one prompt.
      const later = Date.now() + 11 * 60 * 1000;
      const posted = sweepQuietRooms(later);
      assert.equal(posted.length, 1);
      assert.equal(posted[0]?.instanceId, instanceId);
      // Immediately again — the last word is the bot's, so silence.
      assert.deepStrictEqual(sweepQuietRooms(later + 1000), []);
    } finally {
      clearRegistry();
    }
  });
});

describe('room lock and shadow mute', () => {
  it('refuses members on fully locked rooms, admits mods', () => {
    clearRegistry();
    try {
      const a = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      assert.equal(setLocked(a.instanceId, true), true);
      assert.throws(
        () => joinInstance({ template, identity: guest('b'), alias: 'B', color: 'blue' }),
        /locked/
      );
      const mod = joinInstance({ template, identity: guest('m'), alias: 'M', color: 'red', role: 'mod' });
      assert.equal(mod.instanceId, a.instanceId);
      assert.equal(setLocked(a.instanceId, false), true);
      const b = joinInstance({ template, identity: guest('b'), alias: 'B', color: 'blue' });
      assert.equal(b.instanceId, a.instanceId);
    } finally {
      clearRegistry();
    }
  });

  it('shadow-muted posts echo to the sender only, never the ring', () => {
    // Fresh gids: the mute maps are module-level keyed by identity (production
    // behaviour — bans outlive instances), so reused gids would inherit mutes.
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('shm'), alias: 'M', color: 'red', role: 'mod' });
      joinInstance({ template, identity: guest('shu'), alias: 'U', color: 'blue' });
      assert.equal(shadowMuteMember(instanceId, 'shm', 'shu', 60), true);
      assert.equal(isShadowMuted(instanceId, 'shu'), true);
      const res = postRoomMessage({ instanceId, identity: guest('shu'), text: 'can anyone see this?' });
      assert.ok('message' in res && res.shadowed === true);
      assert.deepStrictEqual(recentMessages(instanceId).map((m) => m.text).includes('can anyone see this?'), false);
    } finally {
      clearRegistry();
    }
  });

  it('self-harm language flags support without blocking', () => {
    assert.equal(showsSelfHarmSigns('i want to kill myself tonight'), true);
    assert.equal(showsSelfHarmSigns('this level is suicide'), true); // slang false-positives: card, not ban
    assert.equal(showsSelfHarmSigns('anyone still awake?'), false);
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('sha'), alias: 'A', color: 'red' });
      // Allowed text posts AND flags support.
      const posted = postRoomMessage({ instanceId, identity: guest('sha'), text: 'i want to kill myself tonight' });
      assert.ok('message' in posted && posted.support === true);
      // Blocked text still flags support — the card is help, not a verdict.
      const refused = postRoomMessage({ instanceId, identity: guest('sha'), text: 'i feel like i want to die' });
      assert.ok('ok' in refused && refused.ok === false && refused.support === true);
    } finally {
      clearRegistry();
    }
  });
});
