import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../../../utils/AppError.js';
import { likeFailureCodeFor } from '../shared.js';

describe('likeFailureCodeFor', () => {
  it('maps a dead session (404/409) to no_session and anything else to error', () => {
    assert.equal(likeFailureCodeFor(new AppError(404, 'gone')), 'no_session');
    assert.equal(likeFailureCodeFor(new AppError(409, 'ended')), 'no_session');
    assert.equal(likeFailureCodeFor(new AppError(500, 'boom')), 'error');
    assert.equal(likeFailureCodeFor(new Error('redis')), 'error');
  });
});
