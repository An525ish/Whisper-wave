import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../../../utils/AppError.js';
import { ackCodeOf, toWireMessage } from '../wire.js';
import type { LiveRoomMessage } from '../../../types/room.js';

const raw: LiveRoomMessage = {
  id: 'm1',
  alias: 'Aria',
  color: '#fff',
  role: 'member',
  text: 'hello',
  ts: 1,
  senderGid: 'secret-gid',
  senderUserId: 'secret-user',
  replyTo: 'm0',
  hidden: true,
  reactions: { fire: ['k1'] },
};

describe('wire mapping', () => {
  it('never leaks the sender identity, reaction holders or the hidden flag to non-mods', () => {
    const wire = toWireMessage(raw);
    assert.deepStrictEqual(wire, {
      id: 'm1',
      from: { alias: 'Aria', color: '#fff', role: 'member' },
      text: 'hello',
      ts: 1,
      replyTo: 'm0',
    });
    assert.ok(!JSON.stringify(wire).includes('secret'));
  });

  it('marks hidden messages for mods — still without identities', () => {
    const wire = toWireMessage(raw, { forMod: true });
    assert.equal(wire.hidden, true);
    assert.ok(!JSON.stringify(wire).includes('secret'));
  });

  it('turns only known service codes into ack codes — never prose', () => {
    assert.equal(ackCodeOf(new AppError(403, 'banned')), 'banned');
    assert.equal(ackCodeOf(new AppError(401, 'Room identity required')), 'unknown');
    assert.equal(ackCodeOf(new Error('boom')), 'unknown');
  });
});
