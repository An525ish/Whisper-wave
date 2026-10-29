import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  appendMessage,
  clearRegistry,
  getEvidenceWindow,
  hideMessage,
  isSeated,
  joinInstance,
  leaveInstance,
  liveCounts,
  membersOf,
  onInstanceClosed,
  recentMessages,
  removeMember,
  setLocked,
  toggleReaction,
  unhideMessage,
  findMessageInstance,
} from '../registry.js';
import { guest, template } from './helpers.js';

const msg = (instanceId: string, text: string, alias = 'A', senderGid = 'a') =>
  appendMessage(instanceId, { alias, color: 'red', role: 'member', text, senderGid });

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

  it('numbers instances monotonically — an emptied #1 never lets #2 be overwritten', () => {
    clearRegistry();
    try {
      for (const gid of ['a', 'b', 'c']) joinInstance({ template, identity: guest(gid), alias: gid, color: 'red' });
      const second = joinInstance({ template, identity: guest('d'), alias: 'D', color: 'red' });
      assert.equal(second.instanceId, 'test-room#2');
      // #1 empties and vanishes while #2 lives on…
      for (const gid of ['a', 'b', 'c']) leaveInstance('test-room#1', guest(gid));
      // …then it fills again: the next new instance is #3, not a colliding #2.
      joinInstance({ template, identity: guest('e'), alias: 'E', color: 'red' });
      assert.deepStrictEqual(liveCounts('test-room').map((i) => i.instanceId), ['test-room#2']);
      for (const gid of ['f', 'g']) joinInstance({ template, identity: guest(gid), alias: gid, color: 'red' });
      const next = joinInstance({ template, identity: guest('h'), alias: 'H', color: 'red' });
      assert.equal(next.instanceId, 'test-room#3');
      assert.equal(membersOf('test-room#2').length, 3);
    } finally {
      clearRegistry();
    }
  });

  it('rejoin is idempotent; aliases are unique case-insensitively and across NFKC forms', () => {
    clearRegistry();
    try {
      const first = joinInstance({ template, identity: guest('a'), alias: 'NightOwl', color: 'red' });
      const again = joinInstance({ template, identity: guest('a'), alias: 'nightowl', color: 'red' });
      assert.equal(again.instanceId, first.instanceId);
      assert.equal(membersOf(first.instanceId).length, 1);
      const clash = joinInstance({ template, identity: guest('b'), alias: 'ＮＩＧＨＴＯＷＬ', color: 'blue' });
      assert.ok(clash.member.alias.startsWith('NIGHTOWL·'), clash.member.alias);
      const zw = joinInstance({ template, identity: guest('c'), alias: 'Night​Owl', color: 'blue' });
      assert.ok(zw.member.alias.startsWith('NightOwl·'), zw.member.alias);
    } finally {
      clearRegistry();
    }
  });

  it('empty instances vanish, the ring trims, and close observers fire', () => {
    clearRegistry();
    const closed: string[] = [];
    onInstanceClosed((id) => closed.push(id));
    try {
      const { instanceId } = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      for (let i = 0; i < 105; i += 1) msg(instanceId, `m${i}`);
      assert.equal(recentMessages(instanceId).length, 100);
      assert.equal(recentMessages(instanceId, 5).length, 5);
      assert.equal(leaveInstance(instanceId, guest('a')), 0);
      assert.deepStrictEqual(liveCounts('test-room'), []);
      assert.deepStrictEqual(recentMessages(instanceId), []);
      assert.ok(closed.includes(instanceId));
    } finally {
      clearRegistry();
    }
  });

  it('refuses members on fully locked rooms, admits mods', () => {
    clearRegistry();
    try {
      const a = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      assert.equal(setLocked(a.instanceId, true), true);
      assert.throws(() => joinInstance({ template, identity: guest('b'), alias: 'B', color: 'blue' }), /locked/);
      const mod = joinInstance({ template, identity: guest('m'), alias: 'M', color: 'red', role: 'mod' });
      assert.equal(mod.instanceId, a.instanceId);
      assert.equal(setLocked(a.instanceId, false), true);
      assert.equal(joinInstance({ template, identity: guest('b'), alias: 'B', color: 'blue' }).instanceId, a.instanceId);
    } finally {
      clearRegistry();
    }
  });
});

describe('message ids and scoping', () => {
  it('mints ids server-side and scopes every lookup to its instance', () => {
    clearRegistry();
    try {
      for (const gid of ['a', 'b', 'c', 'd']) joinInstance({ template, identity: guest(gid), alias: gid, color: 'red' });
      const one = msg('test-room#1', 'in one');
      const two = msg('test-room#2', 'in two');
      assert.ok(one && two && one.id !== two.id);
      assert.equal(hideMessage('test-room#2', one.id), false);
      assert.equal(unhideMessage('test-room#2', one.id), null);
      assert.deepStrictEqual(toggleReaction('test-room#2', 'd', one.id, 'fire'), null);
      assert.equal(getEvidenceWindow('test-room#2', one.id, 5).target, null);
      assert.equal(findMessageInstance('test-room', one.id), 'test-room#1');
      assert.equal(findMessageInstance('other-room', one.id), null);
    } finally {
      clearRegistry();
    }
  });
});

describe('room reactions', () => {
  it('toggles per identity, reports counts, and needs a seat', () => {
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      joinInstance({ template, identity: guest('b'), alias: 'B', color: 'blue' });
      const m = msg(instanceId, 'hi');
      assert.ok(m);
      assert.deepStrictEqual(toggleReaction(instanceId, 'a', m.id, 'fire'), { fire: 1 });
      assert.deepStrictEqual(toggleReaction(instanceId, 'b', m.id, 'fire'), { fire: 2 });
      assert.deepStrictEqual(toggleReaction(instanceId, 'a', m.id, 'fire'), { fire: 1 });
      assert.deepStrictEqual(toggleReaction(instanceId, 'b', m.id, 'fire'), {});
      // One reaction per person: a new emoji moves mine.
      assert.deepStrictEqual(toggleReaction(instanceId, 'a', m.id, 'wow'), { wow: 1 });
      assert.deepStrictEqual(toggleReaction(instanceId, 'b', m.id, 'wow'), { wow: 2 });
      assert.deepStrictEqual(toggleReaction(instanceId, 'a', m.id, 'heart'), { wow: 1, heart: 1 });
      assert.equal(toggleReaction(instanceId, 'a', 'missing', 'fire'), null);
      removeMember(instanceId, 'a');
      assert.equal(isSeated(instanceId, 'a'), false);
      assert.equal(toggleReaction(instanceId, 'a', m.id, 'fire'), null);
    } finally {
      clearRegistry();
    }
  });
});

describe('report evidence window', () => {
  it('windows the message plus neighbours from the raw ring, hidden included', () => {
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      const ids = [0, 1, 2, 3, 4].map((i) => msg(instanceId, `line ${i}`)?.id ?? '');
      // A mod delete only hides — the evidence window must still hold the text.
      assert.equal(hideMessage(instanceId, ids[2] ?? ''), true);
      const { items, target } = getEvidenceWindow(instanceId, ids[2] ?? '', 15);
      assert.equal(items.length, 5);
      assert.equal(items[2]?.text, 'line 2');
      assert.equal(items[2]?.hidden, true);
      assert.equal(target?.senderGid, 'a');
      assert.deepStrictEqual(Object.keys(items[0] ?? {}).sort(), ['alias', 'id', 'text', 'ts']);
      assert.equal(getEvidenceWindow(instanceId, 'missing', 15).target, null);
    } finally {
      clearRegistry();
    }
  });

  it('hidden messages leave history but come back on unhide, or show to a mod view', () => {
    clearRegistry();
    try {
      const { instanceId } = joinInstance({ template, identity: guest('a'), alias: 'A', color: 'red' });
      const m = msg(instanceId, 'oops');
      assert.ok(m);
      hideMessage(instanceId, m.id);
      assert.equal(recentMessages(instanceId).length, 0);
      assert.equal(recentMessages(instanceId, 100, true)[0]?.hidden, true);
      assert.equal(unhideMessage(instanceId, m.id)?.id, m.id);
      assert.equal(recentMessages(instanceId).length, 1);
    } finally {
      clearRegistry();
    }
  });
});
