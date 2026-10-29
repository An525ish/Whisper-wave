import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertAdminVisibilityChange,
  assertListingRequestable,
  clampRoomCaps,
  decideInviteJoin,
  idleDeadline,
  isIdleExpired,
  needsInviteProof,
  resolveInviteTerms,
  selectPurgeable,
} from '../privatePolicy.js';
import { decidePrivateRoomEligibility, privateRoomEligibility } from '../../user/entitlements.js';
import { roomCreateSchema } from '../../../validators/rooms.js';
import { AppError } from '../../../utils/AppError.js';

const DAY = 24 * 3_600_000;
const statusOf = (fn: () => void): number | undefined => {
  try {
    fn();
  } catch (err) {
    return err instanceof AppError ? err.statusCode : undefined;
  }
  return undefined;
};

describe('private access decision', () => {
  it('lets a signed-in member with a valid invite in', () => {
    assert.equal(decideInviteJoin({ visibility: 'private', signedIn: true, inviteValid: true }), 'allow');
  });
  it('tells a guest holding a valid invite to sign in (members only)', () => {
    assert.equal(decideInviteJoin({ visibility: 'private', signedIn: false, inviteValid: true }), 'members_only');
  });
  it('answers not_found without proof — never members_only, so slugs cannot be probed', () => {
    assert.equal(decideInviteJoin({ visibility: 'private', signedIn: false, inviteValid: false }), 'not_found');
    assert.equal(decideInviteJoin({ visibility: 'private', signedIn: true, inviteValid: false }), 'not_found');
  });
  it('keeps guests welcome in unlisted rooms', () => {
    assert.equal(decideInviteJoin({ visibility: 'unlisted', signedIn: false, inviteValid: true }), 'allow');
  });
  it('needs no invite for a seated refresh, hosts/mods, or public rooms', () => {
    assert.equal(needsInviteProof('private', 'member', false), true);
    assert.equal(needsInviteProof('private', 'member', true), false);
    assert.equal(needsInviteProof('private', 'host', false), false);
    assert.equal(needsInviteProof('public', 'member', false), false);
    assert.equal(needsInviteProof('unlisted', 'member', false), true);
  });
});

describe('private caps and invite terms', () => {
  it('clamps caps to 20/25 whatever the input, and leaves other rooms alone', () => {
    assert.deepEqual(clampRoomCaps('private', { capSoft: 500, capHard: 900 }), { capSoft: 20, capHard: 25 });
    assert.deepEqual(clampRoomCaps('private', {}), { capSoft: 20, capHard: 25 });
    assert.deepEqual(clampRoomCaps('private', { capSoft: 5, capHard: 8 }), { capSoft: 5, capHard: 8 });
    assert.deepEqual(clampRoomCaps('public', { capSoft: 60 }), { capSoft: 60 });
  });
  it('requires a use limit and clamps uses/ttl for private invites', () => {
    assert.equal(statusOf(() => resolveInviteTerms('private', { maxUses: null }, 7)), 400);
    assert.deepEqual(resolveInviteTerms('private', { maxUses: 1000, ttlDays: 90 }, 7), { maxUses: 25, ttlDays: 30 });
    assert.deepEqual(resolveInviteTerms('private', { maxUses: 5 }, 7), { maxUses: 5, ttlDays: 7 });
  });
  it('leaves unlisted invite terms as before', () => {
    assert.deepEqual(resolveInviteTerms('unlisted', {}, 7), { maxUses: null, ttlDays: 7 });
  });
});

describe('listing and admin boundaries', () => {
  it('rejects listing requests for private rooms only', () => {
    assert.equal(statusOf(() => assertListingRequestable('private')), 409);
    assert.equal(statusOf(() => assertListingRequestable('unlisted')), undefined);
  });
  it('keeps admins on their side of the private boundary', () => {
    assert.equal(statusOf(() => assertAdminVisibilityChange(null, 'private')), 422);
    assert.equal(statusOf(() => assertAdminVisibilityChange('public', 'private')), 422);
    assert.equal(statusOf(() => assertAdminVisibilityChange('private', 'public')), 422);
    assert.equal(statusOf(() => assertAdminVisibilityChange('private', 'private')), undefined);
    assert.equal(statusOf(() => assertAdminVisibilityChange('unlisted', 'public')), undefined);
  });
});

describe('private room entitlement seam', () => {
  it('needs the flag AND a trusted account', () => {
    assert.equal(decidePrivateRoomEligibility({ flagOn: false, trust: 'trusted' }), 'flag_off');
    assert.equal(decidePrivateRoomEligibility({ flagOn: true, trust: 'standard' }), 'not_entitled');
    assert.equal(decidePrivateRoomEligibility({ flagOn: true, trust: null }), 'not_entitled');
    assert.equal(decidePrivateRoomEligibility({ flagOn: true, trust: 'trusted' }), 'ok');
  });
  it('fails closed when the trust lookup throws', async () => {
    const eligibility = await privateRoomEligibility('u', {
      flagOn: () => true,
      trust: async () => {
        throw new Error('db down');
      },
    });
    assert.equal(eligibility, 'not_entitled');
    assert.equal(await privateRoomEligibility('u', { flagOn: () => false, trust: async () => 'trusted' }), 'flag_off');
  });
});

describe('private room idle lifecycle', () => {
  const now = Date.UTC(2026, 0, 1);
  it('sets the deadline 30 days out', () => {
    assert.equal(idleDeadline(now).getTime() - now, 30 * DAY);
  });
  it('expires only private rooms past their deadline', () => {
    const past = new Date(now - 1);
    assert.equal(isIdleExpired({ visibility: 'private', expireAt: past }, now), true);
    assert.equal(isIdleExpired({ visibility: 'private', expireAt: new Date(now + DAY) }, now), false);
    assert.equal(isIdleExpired({ visibility: 'private', expireAt: null }, now), false);
    assert.equal(isIdleExpired({ visibility: 'unlisted', expireAt: past }, now), false);
  });
  it('never purges a room somebody is inside', () => {
    const rooms = [
      { slug: 'a', visibility: 'private' as const, expireAt: new Date(now - DAY) },
      { slug: 'b', visibility: 'private' as const, expireAt: new Date(now - DAY) },
    ];
    assert.deepEqual(selectPurgeable(rooms, now, (s) => s === 'b').map((r) => r.slug), ['a']);
  });
});

describe('room create validator: visibility', () => {
  const base = { slug: 'my-room', title: 'T', description: 'D', rules: ['r'], rulesAccepted: true };
  it('defaults to public and accepts private only', () => {
    assert.equal(roomCreateSchema.parse(base).visibility, 'public');
    assert.equal(roomCreateSchema.safeParse({ ...base, visibility: 'private' }).success, true);
    assert.equal(roomCreateSchema.safeParse({ ...base, visibility: 'official' }).success, false);
  });
});
