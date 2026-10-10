import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { ensureGid } from '../gid.js';
import { GID_COOKIE } from '../../socket/identity.js';

type CookieJar = Record<string, string>;

/** Minimal req/res doubles — the middleware only touches cookies + Set-Cookie. */
const run = (cookies: CookieJar = {}) => {
  const req = { cookies } as unknown as Request;
  const setCookies: Array<{ name: string; value: string }> = [];
  const res = {
    cookie: (name: string, value: string) => {
      setCookies.push({ name, value });
    },
  } as unknown as Response;
  let nexted = false;
  let nextErr: unknown;
  ensureGid(req, res, (err?: unknown) => {
    nexted = true;
    nextErr = err;
  });
  return { req, setCookies, nexted, nextErr };
};

describe('ensureGid', () => {
  it('passes a valid gid through without setting a cookie', () => {
    const gid = uuid();
    const { req, setCookies, nexted, nextErr } = run({ gid });
    assert.equal(nexted, true);
    assert.equal(nextErr, undefined);
    assert.deepStrictEqual(setCookies, []);
    assert.deepStrictEqual(req.identity, { kind: 'guest', gid });
  });

  it('mints a gid for a fresh browser and attaches the guest identity', () => {
    const { req, setCookies, nexted } = run({});
    assert.equal(nexted, true);
    assert.equal(setCookies.length, 1);
    assert.equal(setCookies[0]?.name, GID_COOKIE);
    const minted = setCookies[0]?.value;
    assert.match(minted ?? '', /^[0-9a-f-]{36}$/);
    assert.deepStrictEqual(req.identity, { kind: 'guest', gid: minted });
  });

  it('treats a forged gid exactly like absence — replaces, never trusts', () => {
    const { req, setCookies } = run({ gid: 'not-a-uuid' });
    assert.equal(setCookies.length, 1);
    const minted = setCookies[0]?.value;
    assert.notEqual(minted, 'not-a-uuid');
    assert.deepStrictEqual(req.identity, { kind: 'guest', gid: minted });
  });

  it('carries a valid anonId onto the fresh guest identity', () => {
    const anonId = uuid();
    const { req } = run({ anonId });
    assert.deepStrictEqual(req.identity, {
      kind: 'guest',
      gid: (req.identity as { gid: string }).gid,
      anonId,
    });
  });

  it('never errors — identification is not authentication', () => {
    const cases: CookieJar[] = [{}, { gid: '' }, { gid: '::' }];
    for (const cookies of cases) {
      const { nexted, nextErr } = run(cookies);
      assert.equal(nexted, true);
      assert.equal(nextErr, undefined);
    }
  });
});
