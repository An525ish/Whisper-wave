import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redeemInviteForJoin } from '../invites.js';

/** Fake `consume` standing in for the atomic Mongo update — counts uses against a cap. */
const makeConsume = (roomSlug: string, maxUses: number) => {
  let uses = 0;
  const consume = async () => {
    if (uses >= maxUses) return null;
    uses += 1;
    return { roomSlug } as never;
  };
  return { consume, uses: () => uses };
};

describe('invite redemption', () => {
  it('spends one use per identity, however often it rejoins', async () => {
    const { consume, uses } = makeConsume('priv', 5);
    await redeemInviteForJoin('priv', 'tok-a', ['gid-1'], consume);
    await redeemInviteForJoin('priv', 'tok-a', ['gid-1'], consume);
    await redeemInviteForJoin('priv', 'tok-a', ['gid-1'], consume);
    assert.equal(uses(), 1);
    await redeemInviteForJoin('priv', 'tok-a', ['gid-2'], consume);
    assert.equal(uses(), 2);
  });

  it('remembers by any identity key — signing in does not re-spend', async () => {
    const { consume, uses } = makeConsume('priv', 5);
    await redeemInviteForJoin('priv', 'tok-b', ['gid-3'], consume);
    await redeemInviteForJoin('priv', 'tok-b', ['gid-3', 'user-3'], consume);
    assert.equal(uses(), 1);
  });

  it('answers not_found for exhausted invites and for another room', async () => {
    const full = makeConsume('priv', 0);
    await assert.rejects(redeemInviteForJoin('priv', 'tok-c', ['gid-4'], full.consume), /not_found/);
    const other = makeConsume('somewhere-else', 5);
    await assert.rejects(redeemInviteForJoin('priv', 'tok-d', ['gid-5'], other.consume), /not_found/);
    // A failed redemption is not remembered: a later valid one still works.
    const ok = makeConsume('priv', 5);
    await redeemInviteForJoin('priv', 'tok-d', ['gid-5'], ok.consume);
    assert.equal(ok.uses(), 1);
  });
});
