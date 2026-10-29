import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { postRoomMessage } from '../messaging.js';
import { clearRegistry, joinInstance, recentMessages } from '../registry.js';
import { markChallengePassed } from '../challenge.js';
import { roomMessageSchema } from '../../../validators/rooms.js';
import { template } from './helpers.js';

const roomy = { ...template, capSoft: 50, capHard: 60 };
const GIF = 'https://media.klipy.com/a/b.gif';

const seatWith = (media: Array<'image' | 'gif' | 'meme'>, who: 'member' | 'guest', id: string) => {
  const identity = who === 'member' ? { kind: 'member' as const, userId: id, gid: `g-${id}` } : { kind: 'guest' as const, gid: id };
  markChallengePassed(identity.gid);
  joinInstance({ template: { ...roomy, media }, identity, alias: `Al${id}`, color: '#fff' });
  return identity;
};

describe('room media policy', () => {
  it('lets a member post an allowed GIF and stores it', async () => {
    clearRegistry();
    try {
      const identity = seatWith(['gif'], 'member', 'm1');
      const res = await postRoomMessage({ instanceId: 'test-room#1', identity, text: '', media: { kind: 'gif', url: GIF } });
      assert.ok('message' in res);
      assert.equal(recentMessages('test-room#1')[0]?.media?.url, GIF);
    } finally {
      clearRegistry();
    }
  });

  it('refuses a kind the room has not enabled', async () => {
    clearRegistry();
    try {
      const identity = seatWith(['image'], 'member', 'm2');
      const res = await postRoomMessage({ instanceId: 'test-room#1', identity, text: 'hi', media: { kind: 'gif', url: GIF } });
      assert.ok('ok' in res && res.code === 'media_not_allowed');
    } finally {
      clearRegistry();
    }
  });

  it('refuses media from guests even when the room allows it', async () => {
    clearRegistry();
    try {
      const identity = seatWith(['gif'], 'guest', 'gst1');
      const res = await postRoomMessage({ instanceId: 'test-room#1', identity, text: '', media: { kind: 'gif', url: GIF } });
      assert.ok('ok' in res && res.code === 'media_not_allowed');
    } finally {
      clearRegistry();
    }
  });

  it('refuses a photo key the sender never signed', async () => {
    clearRegistry();
    try {
      const identity = seatWith(['image'], 'member', 'm3');
      const res = await postRoomMessage({
        instanceId: 'test-room#1',
        identity,
        text: '',
        media: { kind: 'image', key: 'ww/rooms/test-room/someone-else/x.jpg' },
      });
      assert.ok('ok' in res && res.code === 'media_failed');
    } finally {
      clearRegistry();
    }
  });

  it('schema: needs text or media, and only accepts GIF/meme links on their own hosts', () => {
    assert.equal(roomMessageSchema.safeParse({ text: '' }).success, false);
    assert.equal(roomMessageSchema.safeParse({ text: '', media: { kind: 'gif', url: GIF } }).success, true);
    assert.equal(roomMessageSchema.safeParse({ text: '', media: { kind: 'gif', url: 'https://evil.example/x.gif' } }).success, false);
    assert.equal(
      roomMessageSchema.safeParse({ text: '', media: { kind: 'meme', url: 'https://api.memegen.link/images/buzz/a/b.png' } }).success,
      true
    );
  });
});
