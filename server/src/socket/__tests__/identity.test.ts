import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { v4 as uuid } from 'uuid';
import {
  ACCESS_COOKIE,
  ANON_COOKIE,
  GID_COOKIE,
  parseAnonId,
  parseGid,
  resolveIdentity,
  verifiedUserId,
} from '../identity.js';
import { generateAccessToken } from '../../utils/token.js';

const gid = uuid();
const anonId = uuid();

describe('parseGid / parseAnonId', () => {
  it('accepts UUIDs and rejects everything else exactly like absence', () => {
    assert.equal(parseGid(gid), gid);
    assert.equal(parseAnonId(anonId), anonId);
    assert.equal(parseGid(undefined), undefined);
    assert.equal(parseGid(''), undefined);
    assert.equal(parseGid('not-a-uuid'), undefined);
    assert.equal(parseGid('../../../etc'), undefined);
    assert.equal(parseGid('a:b:c'), undefined);
    assert.equal(parseAnonId('not-a-uuid'), undefined);
  });

  it('never mixes the namespaces — each parser only reads its own shape', () => {
    // Both are UUIDs; the cookie NAME is what keeps them apart.
    assert.equal(parseGid(anonId), anonId);
    assert.equal(parseAnonId(gid), gid);
  });
});

describe('verifiedUserId', () => {
  it('never throws: garbage tokens stay anonymous', () => {
    assert.equal(verifiedUserId(undefined), undefined);
    assert.equal(verifiedUserId(''), undefined);
    assert.equal(verifiedUserId('garbage'), undefined);
    assert.equal(
      verifiedUserId('eyJhbGciOiJIUzI1NiJ9.forged.signature'),
      undefined
    );
  });

  it('returns the account behind a real access token', () => {
    assert.equal(verifiedUserId(generateAccessToken('user-1')), 'user-1');
  });
});

describe('resolveIdentity', () => {
  it('returns null when there is nothing usable at all', () => {
    assert.equal(resolveIdentity(undefined), null);
    assert.equal(resolveIdentity({}), null);
    assert.equal(resolveIdentity({ gid: 'forged' }), null);
  });

  it('resolves a guest from the gid, carrying the anonId when present', () => {
    assert.deepStrictEqual(resolveIdentity({ [GID_COOKIE]: gid }), {
      kind: 'guest',
      gid,
    });
    assert.deepStrictEqual(
      resolveIdentity({ [GID_COOKIE]: gid, [ANON_COOKIE]: anonId }),
      { kind: 'guest', gid, anonId }
    );
  });

  it('resolves a member from the access token, carrying cookies when present', () => {
    const accessToken = generateAccessToken('user-1');
    assert.deepStrictEqual(resolveIdentity({ [ACCESS_COOKIE]: accessToken }), {
      kind: 'member',
      userId: 'user-1',
    });
    assert.deepStrictEqual(
      resolveIdentity({
        [ACCESS_COOKIE]: accessToken,
        [GID_COOKIE]: gid,
        [ANON_COOKIE]: anonId,
      }),
      { kind: 'member', userId: 'user-1', gid, anonId }
    );
  });

  it('prefers the account over a forged gid', () => {
    const accessToken = generateAccessToken('user-1');
    assert.deepStrictEqual(
      resolveIdentity({ [ACCESS_COOKIE]: accessToken, [GID_COOKIE]: 'forged' }),
      { kind: 'member', userId: 'user-1' }
    );
  });
});
