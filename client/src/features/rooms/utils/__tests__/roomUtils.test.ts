import { describe, expect, it } from 'vitest';
import { ROOM_FAIL_COPY } from '../../constants';
import type { RoomHours, RoomMessage } from '../../types';
import { parseChallengeAnswer } from '../challenge';
import { formatHour, hoursSummary, nextOpensLabel } from '../hours';
import { usedReactions } from '../reactions';
import { endKindOf, failCopy, handshakeCode } from '../roomErrors';
import { isJoinedAbove, previewText, quoteOf } from '../thread';

const message = (over: Partial<RoomMessage> & { id: string }): RoomMessage => ({
  from: { alias: 'Aria', color: '#7dffb8', role: 'member' },
  text: 'hi',
  ts: 1_000,
  ...over,
});

describe('parseChallengeAnswer', () => {
  it('normalises numeric answers', () => {
    expect(parseChallengeAnswer('7')).toBe('7');
    expect(parseChallengeAnswer(' 1 1 ')).toBe('11');
    expect(parseChallengeAnswer('007')).toBe('7');
    expect(parseChallengeAnswer('00')).toBe('0');
    expect(parseChallengeAnswer('-3')).toBe('-3');
  });

  it('refuses anything else', () => {
    expect(parseChallengeAnswer('')).toBeNull();
    expect(parseChallengeAnswer('abc')).toBeNull();
    expect(parseChallengeAnswer('1.5')).toBeNull();
    expect(parseChallengeAnswer('1'.repeat(13))).toBeNull();
  });
});

describe('reactions', () => {
  it('lists used emoji, most used first, skipping zero counts', () => {
    const msg = message({ id: 'a', reactions: { '❤️': 1, '👏': 2, '😮': 0 } });
    expect(usedReactions(msg)).toEqual([
      { key: '👏', count: 2 },
      { key: '❤️', count: 1 },
    ]);
  });
});

describe('room errors', () => {
  it('has copy for every ack code and falls back to unknown', () => {
    expect(failCopy('banned')).toBe(ROOM_FAIL_COPY.banned);
    expect(failCopy('something_new')).toBe(ROOM_FAIL_COPY.unknown);
    expect(failCopy(undefined)).toBe(ROOM_FAIL_COPY.unknown);
  });

  it('reads the handshake code from err.data.code only', () => {
    expect(handshakeCode({ data: { code: 'feature_off' } })).toBe('feature_off');
    expect(handshakeCode({ data: { code: 'zzz' } })).toBeNull();
    expect(handshakeCode(new Error('Room identity required'))).toBeNull();
    expect(handshakeCode(null)).toBeNull();
  });

  it('maps visit-ending codes to cards and leaves the rest inline', () => {
    expect(endKindOf('banned')).toBe('banned');
    expect(endKindOf('feature_off')).toBe('switched_off');
    expect(endKindOf('locked')).toBeNull();
  });
});

describe('thread helpers', () => {
  it('groups a run by the same author within the window', () => {
    const a = message({ id: 'a', ts: 0 });
    expect(isJoinedAbove(a, message({ id: 'b', ts: 60_000 }))).toBe(true);
    expect(isJoinedAbove(a, message({ id: 'c', ts: 6 * 60_000 }))).toBe(false);
    expect(isJoinedAbove(undefined, a)).toBe(false);
    expect(isJoinedAbove(a, message({ id: 'd', system: true }))).toBe(false);
  });

  it('quotes a reply target, skipping bot lines and missing ids', () => {
    const list = [message({ id: 'a', text: 'x'.repeat(80) }), message({ id: 'b', system: true })];
    expect(quoteOf(list, 'a')).toEqual({ alias: 'Aria', preview: `${'x'.repeat(60)}…` });
    expect(quoteOf(list, 'b')).toBeNull();
    expect(quoteOf(list, undefined)).toBeNull();
    expect(previewText('short')).toBe('short');
  });
});

describe('room hours', () => {
  const nightly: RoomHours = { days: [0, 1, 2, 3, 4, 5, 6], start: '22:00', end: '02:00', tz: 'UTC' };
  const monday = Date.UTC(2026, 0, 5, 12, 0);

  it('formats hours and summaries', () => {
    expect(formatHour('22:30')).toBe('10:30pm');
    expect(formatHour('00:00')).toBe('12am');
    expect(hoursSummary(null, monday)).toBe('Always open');
    expect(hoursSummary(nightly, monday)).toBe('Nightly 10pm–2am UTC');
  });

  it('says when a closed room next opens, with day and zone', () => {
    expect(nextOpensLabel(nightly, monday)).toBe('Opens today at 10pm UTC');
    expect(nextOpensLabel(nightly, Date.UTC(2026, 0, 5, 23, 0))).toBe('Opens tomorrow at 10pm UTC');
    expect(nextOpensLabel({ ...nightly, days: [5] }, monday)).toBe('Opens Fri at 10pm UTC');
  });
});
