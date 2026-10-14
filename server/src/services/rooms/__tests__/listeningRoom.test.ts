import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRoomMessage } from '../automod.js';
import { markChallengePassed } from '../challenge.js';
import { buildModNeededNotify } from '../modNudge.js';
import {
  createModPresence,
  deriveRoomStatus,
  isPostingPaused,
  isStaffed,
  modPresent,
  resetModPresence,
} from '../modPresence.js';
import { postRoomMessage } from '../messaging.js';
import { muteMember } from '../mods.js';
import { clearRegistry, joinInstance, leaveInstance } from '../registry.js';
import { strictProfile, strictProfileFor } from '../strictProfile.js';
import { guest } from './helpers.js';
import type { RoomRole } from '../../../types/room.js';

const vent = { slug: 'vent-test', title: 'Vent', capSoft: 50, capHard: 60, requiresModPresence: true };
const seatVent = (gid: string, role: RoomRole = 'member') => {
  markChallengePassed(gid);
  return joinInstance({ template: vent, identity: guest(gid), alias: gid, color: '#fff', role });
};

describe('deriveRoomStatus', () => {
  const combos = [
    { hoursOpen: true, requiresModPresence: false, staffed: false, want: 'open' },
    { hoursOpen: true, requiresModPresence: false, staffed: true, want: 'open' },
    { hoursOpen: true, requiresModPresence: true, staffed: true, want: 'open' },
    { hoursOpen: true, requiresModPresence: true, staffed: false, want: 'waiting_mod' },
    { hoursOpen: false, requiresModPresence: false, staffed: false, want: 'closed' },
    { hoursOpen: false, requiresModPresence: true, staffed: false, want: 'closed' },
    { hoursOpen: false, requiresModPresence: true, staffed: true, want: 'closed' },
    { hoursOpen: false, requiresModPresence: false, staffed: true, want: 'closed' },
  ] as const;
  for (const { want, ...input } of combos) {
    it(`${JSON.stringify(input)} -> ${want}`, () => assert.equal(deriveRoomStatus(input), want));
  }
});

describe('modPresent', () => {
  it('counts mod/host/admin, never guests, never muted mods', () => {
    clearRegistry();
    try {
      seatVent('mp-guest');
      assert.equal(modPresent('vent-test'), false);
      seatVent('mp-mod', 'mod');
      assert.equal(modPresent('vent-test'), true);
      seatVent('mp-admin', 'admin');
      assert.equal(muteMember('vent-test#1', 'mp-admin', 'mp-mod', 5), true);
      leaveInstance('vent-test#1', guest('mp-admin'));
      assert.equal(modPresent('vent-test'), false, 'muted mod does not count');
      seatVent('mp-host', 'host');
      assert.equal(modPresent('vent-test'), true);
      leaveInstance('vent-test#1', guest('mp-host'));
    } finally {
      clearRegistry();
      resetModPresence();
    }
  });
});

describe('mod_absent gate', () => {
  it('pure gate', () => {
    assert.equal(isPostingPaused(true, false), true);
    assert.equal(isPostingPaused(true, true), false);
    assert.equal(isPostingPaused(false, false), false);
    assert.equal(isPostingPaused(undefined, false), false);
  });

  it('refuses posts until a mod seats, then lets them through', async () => {
    clearRegistry();
    try {
      seatVent('ga-member');
      assert.equal(isStaffed('vent-test'), false);
      const refused = await postRoomMessage({ instanceId: 'vent-test#1', identity: guest('ga-member'), text: 'hello' });
      assert.ok('ok' in refused && refused.code === 'mod_absent');

      seatVent('ga-mod', 'mod');
      assert.equal(isStaffed('vent-test'), true);
      const allowed = await postRoomMessage({ instanceId: 'vent-test#1', identity: guest('ga-member'), text: 'hello again' });
      assert.ok('message' in allowed);
    } finally {
      clearRegistry();
      resetModPresence();
    }
  });
});

describe('strict profile', () => {
  it('has the agreed values', () => {
    assert.deepEqual(strictProfile, {
      slowModeMinMs: 8_000,
      blockLinks: true,
      duplicateWindow: 8,
      maxLength: 280,
      blockMentions: true,
    });
    assert.equal(strictProfileFor('member'), strictProfile);
    assert.equal(strictProfileFor('mod').slowModeMinMs, 0);
    assert.equal(strictProfileFor('mod').blockLinks, false);
  });

  const base = {
    sender: { kind: 'guest' as const, gid: 'x' },
    linksAllowed: false,
    slowModeMs: 2_000,
    recentTexts: [] as string[],
    now: 0,
    strict: strictProfile,
  };

  it('raises slow mode to at least 8 s, even when a mod set it lower', () => {
    const v = checkRoomMessage({ ...base, text: 'hi there', slowModeMs: 0, msSinceLastPost: 5_000 });
    assert.ok(!v.allowed && v.code === 'slow_mode' && v.retryAfterMs === 3_000);
    assert.ok(checkRoomMessage({ ...base, text: 'hi there', msSinceLastPost: 8_000 }).allowed);
  });

  it('refuses long messages and @mentions; the normal path allows them', () => {
    const long = 'a'.repeat(281);
    assert.ok(!checkRoomMessage({ ...base, text: long }).allowed);
    assert.ok(!checkRoomMessage({ ...base, text: 'hey @someone you there' }).allowed);
    const { strict: _strict, ...normal } = base;
    assert.ok(checkRoomMessage({ ...normal, text: 'hey @someone you there' }).allowed);
  });

  it('compares duplicates over a wider window', () => {
    const recent = ['same words here', 'b one', 'c two', 'd three', 'e four'];
    assert.ok(!checkRoomMessage({ ...base, text: 'same words here', recentTexts: recent }).allowed);
    const { strict: _strict, ...normal } = base;
    assert.ok(checkRoomMessage({ ...normal, text: 'same words here', recentTexts: recent }).allowed);
  });
});

describe('mod presence grace', () => {
  const setup = () => {
    let mod = false;
    const timers: Array<{ fn: () => void; ms: number; live: boolean }> = [];
    const events: string[] = [];
    const mp = createModPresence({
      graceMs: 180_000,
      schedule: (fn, ms) => {
        const t = { fn, ms, live: true };
        timers.push(t);
        return () => { t.live = false; };
      },
      hasMod: () => mod,
      requires: () => true,
      onChange: (slug, state) => events.push(`${slug}:${state}`),
    });
    const fire = () => timers.filter((t) => t.live).forEach((t) => { t.live = false; t.fn(); });
    return { mp, events, timers, fire, setMod: (v: boolean) => { mod = v; } };
  };

  it('resumes at once on the first mod, pauses only after the grace', () => {
    const { mp, events, timers, fire, setMod } = setup();
    assert.equal(mp.isStaffed('v'), false);
    setMod(true);
    mp.sync('v');
    assert.deepEqual(events, ['v:resumed']);

    setMod(false);
    mp.sync('v');
    assert.equal(timers.length, 1);
    assert.equal(timers[0]?.ms, 180_000);
    mp.sync('v'); // another seat change during grace: still one timer
    assert.equal(timers.length, 1);
    assert.equal(mp.isStaffed('v'), true);
    assert.deepEqual(events, ['v:resumed']);

    fire();
    assert.deepEqual(events, ['v:resumed', 'v:paused']);
    assert.equal(mp.isStaffed('v'), false);
  });

  it('a mod returning inside the grace cancels the pause; leaving again restarts it', () => {
    const { mp, events, timers, fire, setMod } = setup();
    setMod(true);
    mp.sync('v');
    setMod(false);
    mp.sync('v');
    setMod(true);
    mp.sync('v');
    assert.equal(timers[0]?.live, false);
    fire();
    assert.deepEqual(events, ['v:resumed']);

    setMod(false);
    mp.sync('v');
    assert.equal(timers.length, 2);
    fire();
    assert.deepEqual(events, ['v:resumed', 'v:paused']);
  });

  it('reset drops timers and state', () => {
    const { mp, events, timers, fire, setMod } = setup();
    setMod(true);
    mp.sync('v');
    setMod(false);
    mp.sync('v');
    mp.reset();
    fire();
    assert.equal(timers[0]?.live, false);
    assert.deepEqual(events, ['v:resumed']);
  });
});

describe('mod-needed intent', () => {
  const tpl = { slug: 'venting', title: 'Venting', mods: ['m1', 'm2'] as never, requiresModPresence: true };

  it('carries a head count only — no identities, no text', () => {
    const n = buildModNeededNotify(tpl, false, 3);
    assert.deepEqual(n, {
      event: 'mod-needed',
      members: ['m1', 'm2'],
      push: { kind: 'mod-needed', slug: 'venting', title: 'Venting', waiting: 3 },
    });
  });

  it('is skipped when staffed, not a listening room, or no mods exist', () => {
    assert.equal(buildModNeededNotify(tpl, true, 3), null);
    assert.equal(buildModNeededNotify({ ...tpl, requiresModPresence: false }, false, 3), null);
    assert.equal(buildModNeededNotify({ ...tpl, mods: [] as never }, false, 3), null);
  });
});
