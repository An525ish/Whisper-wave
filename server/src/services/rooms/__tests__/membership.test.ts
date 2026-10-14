import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertAliasAllowed, assertJoinAllowed, colorForAlias } from '../membership.js';

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

describe('alias gate', () => {
  it('rejects reserved, invisible-padded and link-shaped aliases with a stable code', () => {
    for (const bad of ['Admin', 'wave team', 'Wave\u200b Team', 'ＡＤＭＩＮ', 'the mod', 'Moderator_1', 'night.owl.gg', 'w a v e']) {
      assert.throws(() => assertAliasAllowed(bad), /alias_invalid/, bad);
    }
  });

  it('lets ordinary names through, including whole-word lookalikes', () => {
    for (const ok of ['NightOwl', 'Modesty', 'Admiral', 'Aria', 'कावेरी']) {
      assert.doesNotThrow(() => assertAliasAllowed(ok), ok);
    }
  });
});
