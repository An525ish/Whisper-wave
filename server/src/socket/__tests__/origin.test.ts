import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isOriginAllowed } from '../../config/cors.js';

const allow = ['https://wave.example'];

describe('socket origin check', () => {
  it('lets non-browser clients (no Origin) through', () => {
    assert.equal(isOriginAllowed(undefined, 'api.example', allow), true);
  });

  it('allows allowlisted origins and the same host, refuses cross-site', () => {
    assert.equal(isOriginAllowed('https://wave.example', 'api.example', allow), true);
    assert.equal(isOriginAllowed('https://api.example', 'api.example', allow), true);
    assert.equal(isOriginAllowed('https://evil.example', 'api.example', allow), false);
    assert.equal(isOriginAllowed('https://wave.example.evil.com', 'api.example', allow), false);
  });

  it('refuses garbage origins and an empty allowlist for foreign sites', () => {
    assert.equal(isOriginAllowed('null', 'api.example', allow), false);
    assert.equal(isOriginAllowed('https://evil.example', 'api.example', []), false);
    assert.equal(isOriginAllowed('https://evil.example', undefined, allow), false);
  });
});
