import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Namespace } from 'socket.io';
import { MATCH_FOUND } from '../../../constants/anon-events.js';
import type { WaitingCard } from '../../../types/match.js';
import { emitMatchFound } from '../emitMatchFound.js';

/**
 * The ordering regression.
 *
 * `emitMatchFound` used to emit MATCH_FOUND first and attach `sessionId` to the
 * sockets afterwards. Everything downstream reads `socket.sessionId` — most
 * importantly `ANON_NEXT`, which uses it to decide whether to tear the session down
 * and tell the partner. In the old order a skip arriving in that window read
 * `undefined`, skipped the teardown, and left the partner in a chat that no longer
 * existed, with no notification and no way to notice.
 *
 * Asserted directly rather than through two live sockets because the invariant that
 * broke is the ordering itself. A real socket hides the very thing under test.
 */

type Step =
  | { kind: 'attach'; room: string }
  | { kind: 'emit'; room: string; event: string; sessionIdAtEmit?: string };

const fake = () => {
  const rooms: Record<string, { sessionId?: string }> = {};
  const steps: Step[] = [];
  const payloads: Record<string, unknown> = {};

  const nsp = {
    in: (room: string) => ({
      async fetchSockets() {
        steps.push({ kind: 'attach', room });
        // Created on demand so a room is populated exactly when it is first
        // fetched — the returned object is a reference, so the mutation the
        // function performs on it is visible to the assertions.
        rooms[room] ??= {};
        return [rooms[room]];
      },
    }),
    to: (room: string) => ({
      emit: (event: string, payload?: unknown) => {
        steps.push({
          kind: 'emit',
          room,
          event,
          // Snapshot the id as it stands AT EMIT TIME. If the attach has not
          // happened yet this is undefined — which is precisely the bug.
          sessionIdAtEmit: rooms[room]?.sessionId,
        });
        payloads[room] = payload;
      },
    }),
  } as unknown as Namespace;

  return { nsp, steps, payloads, rooms };
};

const card = (anonId: string, displayName: string, vibeTags: string[] = []): WaitingCard => ({
  anonId,
  displayName,
  vibeTags,
  gender: 'prefer_not_to_say',
  joinedAt: 1_700_000_000_000,
});

describe('emitMatchFound', () => {
  it('attaches sessionId to both sockets before either is told the match exists', async () => {
    const { nsp, steps, rooms } = fake();

    await emitMatchFound(
      nsp,
      'session-xyz',
      'local-1',
      'partner-1',
      card('local-1', 'NightOwl', ['music']),
      card('partner-1', 'LeavePal', ['gaming']),
      1_700_000_000_000
    );

    const firstEmit = steps.findIndex((s) => s.kind === 'emit');
    assert.ok(firstEmit >= 0, 'expected MATCH_FOUND to be emitted');

    const attachesBeforeFirstEmit = steps
      .slice(0, firstEmit)
      .filter((s) => s.kind === 'attach');
    assert.equal(
      attachesBeforeFirstEmit.length,
      2,
      'both sockets must be attached before the first emit'
    );

    for (const step of steps.filter((s) => s.kind === 'emit')) {
      assert.equal(step.event, MATCH_FOUND);
      assert.equal(
        step.sessionIdAtEmit,
        'session-xyz',
        `emitting to ${step.room} before its sessionId was attached is the race`
      );
    }

    assert.equal(rooms['anon:local-1']?.sessionId, 'session-xyz');
    assert.equal(rooms['anon:partner-1']?.sessionId, 'session-xyz');
  });

  it('carries the real createdAt and gives each side the other alias', async () => {
    const { nsp, payloads } = fake();
    const createdAt = 1_700_000_000_000;

    await emitMatchFound(
      nsp,
      'session-xyz',
      'a',
      'b',
      card('a', 'NightOwl', ['music']),
      card('b', 'LeavePal', ['gaming']),
      createdAt
    );

    const toA = payloads['anon:a'] as {
      createdAt: number;
      partner: { displayName: string; vibeTags: string[] };
    };
    const toB = payloads['anon:b'] as {
      createdAt: number;
      partner: { displayName: string; vibeTags: string[] };
    };

    assert.equal(toA.createdAt, createdAt);
    assert.equal(toB.createdAt, createdAt);
    assert.equal(toA.partner.displayName, 'LeavePal');
    assert.equal(toB.partner.displayName, 'NightOwl');
    assert.deepEqual(toA.partner.vibeTags, ['gaming']);
    assert.deepEqual(toB.partner.vibeTags, ['music']);
  });
});
