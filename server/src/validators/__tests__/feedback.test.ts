import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { submitFeedbackSchema } from '../feedback.js';

describe('submitFeedbackSchema', () => {
  it('accepts each kind with only the fields it uses', () => {
    assert.ok(submitFeedbackSchema.safeParse({ kind: 'app', title: 'Wavelength', message: 'A radio for two' }).success);
    assert.ok(submitFeedbackSchema.safeParse({ kind: 'feedback', rating: 4, area: 'Rooms', message: 'Love the rooms' }).success);
    assert.ok(submitFeedbackSchema.safeParse({ kind: 'problem', type: 'Bug', message: 'Send button froze' }).success);
  });

  it('rejects too-short messages, unknown kinds and out-of-range ratings', () => {
    assert.ok(!submitFeedbackSchema.safeParse({ kind: 'feedback', message: 'hi' }).success);
    assert.ok(!submitFeedbackSchema.safeParse({ kind: 'spam', message: 'hello there' }).success);
    assert.ok(!submitFeedbackSchema.safeParse({ kind: 'feedback', rating: 9, message: 'hello there' }).success);
  });

  it('caps the message so one request cannot carry a huge email', () => {
    assert.ok(!submitFeedbackSchema.safeParse({ kind: 'feedback', message: 'x'.repeat(1501) }).success);
  });
});
