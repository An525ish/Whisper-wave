import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRoomMessage, containsLink, screenAlias, screenText, showsSelfHarmSigns } from '../automod.js';
import { guest } from './helpers.js';

const base = {
  linksAllowed: false,
  slowModeMs: 3000,
  recentTexts: [] as string[],
  now: Date.now(),
};

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

  it('blocks word-list hits and names severe ones (with category) for auto-report', () => {
    const soft = checkRoomMessage({ ...base, text: 'send nudes', sender: guest('g1') });
    assert.ok(!soft.allowed && soft.code === 'blocked_content' && soft.severe === false);
    const severe = checkRoomMessage({ ...base, text: 'loli', sender: guest('g1') });
    assert.ok(!severe.allowed && severe.severe === true && severe.category === 'sexual');
  });

  it('sees through zero-width characters in the word list', () => {
    assert.equal(checkRoomMessage({ ...base, text: 'se​nd nu​des', sender: guest('g1') }).allowed, false);
  });

  it('blocks links for guests, allows them when permitted', () => {
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

  it('suppresses repeats, floods and walls of lines', () => {
    const dup = { ...base, text: 'Hello!', sender: guest('g1'), recentTexts: ['hello!'] };
    assert.deepStrictEqual(checkRoomMessage(dup), { allowed: false, code: 'duplicate' });
    assert.equal(
      checkRoomMessage({ ...base, text: 'THIS IS ABSOLUTELY UNACCEPTABLE BEHAVIOR', sender: guest('g1') }).allowed,
      false
    );
    assert.equal(checkRoomMessage({ ...base, text: '🔥🔥🔥🔥🔥🔥🔥🔥🔥', sender: guest('g1') }).allowed, false);
    const wall = Array.from({ length: 8 }, (_, i) => `line ${i}`).join('\n');
    assert.deepStrictEqual(checkRoomMessage({ ...base, text: wall, sender: guest('g1') }), {
      allowed: false,
      code: 'spam',
    });
    assert.equal(checkRoomMessage({ ...base, text: 'one\ntwo\nthree', sender: guest('g1') }).allowed, true);
  });
});

describe('link detection', () => {
  it('catches explicit and short-TLD hosts', () => {
    for (const t of ['https://x.io/a', 'www.example.com', 'example.com', 'join discord.gg/abc', 'cool.ly', 'foo.gg', 'my.to', 't.me/abc', 'bit.ly/3xyz', 'wa.me/9198', '192.168.0.1']) {
      assert.equal(containsLink(t), true, t);
    }
  });

  it('catches evasions: zero-width, fullwidth and ideographic dots, spacing, spelled dots', () => {
    for (const t of [
      'exam​ple.com',
      'example．com',
      'example。com',
      'ｅｘａｍｐｌｅ.ｃｏｍ',
      'ex⁠ample.c​om',
      't . me/abc',
      'discord .gg/abc',
      'example[.]com',
      'example(dot)com',
      'example (dot) com',
    ]) {
      assert.equal(containsLink(t), true, JSON.stringify(t));
    }
  });

  it('leaves ordinary chat alone', () => {
    for (const t of ['anyone awake?', 'wait...what', 'e.g. this one', 'it costs 3.5k', 'I was like... ok', 'v1.5 is out', 'U.S.A rules', 'habit. me too']) {
      assert.equal(containsLink(t), false, t);
    }
  });
});

describe('text and alias screening', () => {
  it('screenText flags word-list hits and links', () => {
    assert.deepStrictEqual(screenText('Chill music room'), { ok: true });
    assert.equal(screenText('send nudes here').ok, false);
    assert.deepStrictEqual(screenText('visit cool.gg now'), { ok: false, reason: 'blocked_link' });
  });

  it('screenAlias keeps staff names for staff', () => {
    assert.equal(screenAlias('Wave Team').ok, false);
    assert.equal(screenAlias('ＭＯＤ').ok, false);
    assert.equal(screenAlias('NightOwl').ok, true);
  });
});

describe('self-harm language', () => {
  it('is detected without being a block verdict', () => {
    assert.equal(showsSelfHarmSigns('i want to kill myself tonight'), true);
    assert.equal(showsSelfHarmSigns('this level is suicide'), true); // slang false-positives: card, not ban
    assert.equal(showsSelfHarmSigns('anyone still awake?'), false);
  });
});
