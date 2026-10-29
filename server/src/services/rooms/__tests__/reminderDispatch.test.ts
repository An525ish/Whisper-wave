import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runReminderTick } from '../reminderDispatch.js';
import type { ReminderDispatchDeps } from '../../../types/roomReminder.js';

const hours = { days: [1], start: '10:00', end: '12:00', tz: 'Asia/Kolkata' };

const makeDeps = (over: Partial<ReminderDispatchDeps> = {}) => {
  const taken: string[] = [];
  const sent: Array<{ slug: string; title: string; userIds: string[] }> = [];
  const deps: ReminderDispatchDeps = {
    distinctSlugs: async () => ['a', 'b'],
    findRoom: async (slug) => (slug === 'gone' ? null : { title: `Room ${slug}`, hours }),
    takeUserIds: async (slug) => {
      taken.push(slug);
      return ['u1', 'u2'];
    },
    isOpen: (_h, _now) => true,
    notify: (slug, title, userIds) => sent.push({ slug, title, userIds }),
    ...over,
  };
  return { deps, taken, sent };
};

describe('room reminder tick', () => {
  it('notifies and consumes reminders only for rooms open now', async () => {
    const { deps, taken, sent } = makeDeps({ isOpen: () => false });
    assert.deepEqual(await runReminderTick(deps), []);
    assert.deepEqual(taken, []);
    assert.equal(sent.length, 0);

    const open = makeDeps();
    assert.deepEqual(await runReminderTick(open.deps), ['a', 'b']);
    assert.deepEqual(open.sent[0], { slug: 'a', title: 'Room a', userIds: ['u1', 'u2'] });
  });

  it('drops reminders for deleted rooms without notifying', async () => {
    const { deps, taken, sent } = makeDeps({ distinctSlugs: async () => ['gone'] });
    assert.deepEqual(await runReminderTick(deps), []);
    assert.deepEqual(taken, ['gone']);
    assert.equal(sent.length, 0);
  });

  it('skips a room whose hours throw and continues with the rest', async () => {
    let calls = 0;
    const { deps, sent } = makeDeps({
      isOpen: () => {
        if (++calls === 1) throw new RangeError('bad tz');
        return true;
      },
    });
    assert.deepEqual(await runReminderTick(deps), ['b']);
    assert.equal(sent.length, 1);
  });
});
