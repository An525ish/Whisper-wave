import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sendGifSchema } from '../../../validators/message.js';
import { memeModeSchema } from '../../../validators/memes.js';
import {
  blockJokeId,
  isJokeBlocked,
  listBlockedJokeIds,
  unblockJokeId,
} from '../blocklist.js';
import {
  memeImageUrl,
  normalizeJoke,
  slugifyMemeText,
  templateFor,
} from '../jokeapi.js';

describe('meme text slugify', () => {
  it('encodes spaces and Memegen escapes', () => {
    assert.equal(slugifyMemeText('hello world'), 'hello_world');
    assert.equal(slugifyMemeText('really? yes & no'), 'really~q_yes_~a_no');
    assert.equal(slugifyMemeText('a_b-c'), 'a__b--c');
    assert.equal(slugifyMemeText('50% off #deal'), '50~p_off_~hdeal');
  });

  it('truncates long jokes to URL-safe length', () => {
    const long = 'x'.repeat(500);
    assert.ok(slugifyMemeText(long).length <= 180);
    assert.equal(slugifyMemeText('  spaced out  '), 'spaced_out');
  });
});

describe('meme image urls', () => {
  it('rotates templates deterministically per joke id', () => {
    assert.equal(templateFor(7), templateFor(7));
    assert.match(
      memeImageUrl({ id: 7, setup: 'hi' }),
      /^https:\/\/api\.memegen\.link\/images\/[a-z]+\/hi\/_\.jpg\?width=600$/
    );
  });

  it('maps two-parters to top/bottom text', () => {
    const url = memeImageUrl({ id: 3, setup: 'Why?', delivery: 'Because.' });
    assert.ok(url.includes('/Why~q/Because..jpg'), url);
  });
});

describe('joke normalization', () => {
  it('keeps single jokes whole and splits two-parters', () => {
    const single = normalizeJoke({ id: 1, category: 'Misc', type: 'single', joke: 'A horse walks into a bar' });
    assert.equal(single.setup, 'A horse walks into a bar');
    assert.equal(single.delivery, undefined);
    assert.ok(single.imageUrl.startsWith('https://api.memegen.link/'));

    const two = normalizeJoke({ id: 2, category: 'Pun', type: 'twopart', setup: 'Setup?', delivery: 'Delivery!' });
    assert.equal(two.setup, 'Setup?');
    assert.equal(two.delivery, 'Delivery!');
  });
});

describe('meme blocklist', () => {
  it('blocks, lists and unblocks provider ids', () => {
    assert.equal(isJokeBlocked(424242), false);
    blockJokeId(424242);
    assert.equal(isJokeBlocked(424242), true);
    assert.ok(listBlockedJokeIds().includes(424242));
    assert.equal(unblockJokeId(424242), true);
    assert.equal(unblockJokeId(424242), false);
  });
});

describe('meme share validation', () => {  it('allows memegen urls for kind meme and klipy for kind gif, nothing crossed', () => {
    const meme = {
      chatId: '507f1f77bcf86cd799439011',
      gifId: 'meme-42',
      gifUrl: 'https://api.memegen.link/images/buzz/top/_bottom.jpg?width=600',
      mimeType: 'image/jpeg',
      kind: 'meme',
    } as const;
    assert.equal(sendGifSchema.safeParse(meme).success, true);
    assert.equal(
      sendGifSchema.safeParse({ ...meme, gifUrl: 'https://i.redd.it/x.jpg' }).success,
      false
    );
    const gif = {
      chatId: '507f1f77bcf86cd799439011',
      gifId: 'g1',
      gifUrl: 'https://media.klipy.com/x.gif',
    } as const;
    assert.equal(sendGifSchema.safeParse(gif).success, true);
    assert.equal(
      sendGifSchema.safeParse({ ...gif, gifUrl: 'https://api.memegen.link/images/buzz/a/b.jpg' }).success,
      false
    );
  });
});

describe('meme mode gate', () => {
  it('enabling unfiltered requires the 18+ self-declaration; disabling needs nothing', () => {
    assert.equal(memeModeSchema.safeParse({ unfiltered: true }).success, false);
    assert.equal(
      memeModeSchema.safeParse({ unfiltered: true, confirmAdult: false }).success,
      false
    );
    assert.equal(
      memeModeSchema.safeParse({ unfiltered: true, confirmAdult: true }).success,
      true
    );
    assert.equal(memeModeSchema.safeParse({ unfiltered: false }).success, true);
  });
});
