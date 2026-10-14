import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sweepQuietRooms } from '../wavebot.js';
import { appendMessage, clearRegistry } from '../registry.js';
import { seat } from './helpers.js';

describe('wave bot', () => {
  it('prompts quiet rooms once, never solos, never twice in a row', () => {
    clearRegistry();
    try {
      const { instanceId } = seat('wb-a', 'A');
      assert.deepStrictEqual(sweepQuietRooms(Date.now()), []); // solo — no audience
      seat('wb-b', 'B');
      appendMessage(instanceId, { alias: 'A', color: 'red', role: 'member', text: 'hi', senderGid: 'wb-a' });
      assert.deepStrictEqual(sweepQuietRooms(Date.now()), []); // fresh room — not quiet yet
      const later = Date.now() + 11 * 60 * 1000;
      const posted = sweepQuietRooms(later);
      assert.equal(posted.length, 1);
      assert.equal(posted[0]?.instanceId, instanceId);
      assert.deepStrictEqual(sweepQuietRooms(later + 1000), []); // last word is the bot's
    } finally {
      clearRegistry();
    }
  });
});
