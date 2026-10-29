import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { sendGifSchema } from '../../../validators/message.js';
import { memeModeSchema } from '../../../validators/memes.js';
import { memeReportSchema } from '../../../validators/memes.js';
import {
  REPORT_BLOCK_THRESHOLD,
  createReportDeduper,
  shouldAutoBlock,
} from '../report.js';
import {
  fetchJokes,
  memeImageUrl,
  normalizeJoke,
  slugifyMemeText,
  templateFor,
} from '../jokeapi.js';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('meme text slugify', () => {
  it('encodes spaces and Memegen escapes', () => {
    assert.equal(slugifyMemeText('hello world'), 'hello_world');
    assert.equal(slugifyMemeText('really? yes & no'), 'really~q_yes_~a_no');
    assert.equal(slugifyMemeText('a_b-c'), 'a__b--c');
    assert.equal(slugifyMemeText('50% off #deal'), '50~p_off_~hdeal');
  });

  it('escapes tilde first-class and applies the documented quote/slash rules', () => {
    assert.equal(slugifyMemeText('~'), '~~');
    assert.equal(slugifyMemeText('a/b\\c'), 'a~sb~bc');
    assert.equal(slugifyMemeText('<x>'), '~lx~g');
    assert.equal(slugifyMemeText('say "hi"'), "say_''hi''");
    assert.equal(slugifyMemeText("it's"), "it's");
  });

  it('percent-encodes everything else, incl. non-ASCII, semicolons and backticks', () => {
    assert.equal(slugifyMemeText('a;b`c'), 'a%3Bb%60c');
    assert.equal(slugifyMemeText('café'), 'caf%C3%A9');
    assert.equal(slugifyMemeText('😀'), '%F0%9F%98%80');
  });

  it('never throws on lone surrogates or control characters', () => {
    assert.equal(slugifyMemeText('a\uD800b'), 'a_b');
    assert.equal(slugifyMemeText('a\u0000b\nc'), 'a_b_c');
  });

  it('replaces dot-only and empty segments so a path never collapses', () => {
    assert.equal(slugifyMemeText('..'), '_');
    assert.equal(slugifyMemeText('.'), '_');
    assert.equal(slugifyMemeText('   '), '_');
    assert.equal(slugifyMemeText('a..'), 'a..');
  });

  it('truncates by code points, never splitting a surrogate pair', () => {
    const slug = slugifyMemeText('😀'.repeat(300));
    assert.equal(slug, '%F0%9F%98%80'.repeat(180));
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

describe('report intake', () => {
  it('auto-blocks exactly at the threshold, once', () => {
    assert.equal(shouldAutoBlock(REPORT_BLOCK_THRESHOLD - 1, false), false);
    assert.equal(shouldAutoBlock(REPORT_BLOCK_THRESHOLD, false), true);
    assert.equal(shouldAutoBlock(REPORT_BLOCK_THRESHOLD + 5, true), false);
  });

  it('dedupes a reporter inside the window and counts them again after it', () => {
    const firstSight = createReportDeduper(10, 1000);
    assert.equal(firstSight('gid:jokeapi:1', 0), true);
    assert.equal(firstSight('gid:jokeapi:1', 500), false);
    assert.equal(firstSight('other:jokeapi:1', 500), true);
    assert.equal(firstSight('gid:jokeapi:1', 1001), true);
  });

  it('stays bounded: oldest entries make room instead of the map growing', () => {
    const firstSight = createReportDeduper(3, 10_000);
    for (let i = 0; i < 50; i++) firstSight(`k${i}`, i);
    assert.equal(firstSight('k49', 60), false, 'recent entry still remembered');
    assert.equal(firstSight('k0', 60), true, 'oldest was evicted');
  });

  it('validates the report body', () => {
    const ok = { externalId: 7, source: 'jokeapi', reason: 'offensive' };
    assert.equal(memeReportSchema.safeParse(ok).success, true);
    assert.equal(memeReportSchema.safeParse({ ...ok, reason: 'because' }).success, false);
    assert.equal(memeReportSchema.safeParse({ ...ok, externalId: -1 }).success, false);
    assert.equal(memeReportSchema.safeParse({ ...ok, source: 'klipy' }).success, false);
  });
});

describe('JokeAPI fetch hardening', () => {
  const single = (id: number, extra: Record<string, unknown> = {}) => ({
    id,
    category: 'Misc',
    type: 'single',
    joke: `Joke ${id}`,
    ...extra,
  });
  const batch = (jokes: unknown[]) => new Response(JSON.stringify({ error: false, amount: jokes.length, jokes }));

  it('drops invalid entries instead of failing the batch', async () => {
    globalThis.fetch = (async () =>
      batch([
        single(1),
        single(-4),
        single(2, { joke: 'x'.repeat(501) }),
        single(3, { category: 'Nonsense' }),
        { id: 5, category: 'Misc', type: 'twopart', setup: 'only setup' },
        single(6),
      ])) as typeof fetch;
    const jokes = await fetchJokes({ category: 'misc' });
    assert.deepEqual(jokes.map((j) => j.id), [1, 6]);
  });

  it('rejects more than ten jokes as outside the contract', async () => {
    globalThis.fetch = (async () =>
      batch(Array.from({ length: 11 }, (_, i) => single(i)))) as typeof fetch;
    await assert.rejects(fetchJokes({ category: 'misc' }), { name: 'ProviderError' });
  });

  it('keeps flagged jokes out of filtered mode even if the provider ignores the blacklist', async () => {
    globalThis.fetch = (async () =>
      batch([single(1, { flags: { racist: true } }), single(2, { flags: { racist: false } })])) as typeof fetch;
    assert.deepEqual((await fetchJokes({ category: 'misc' })).map((j) => j.id), [2]);
    assert.deepEqual(
      (await fetchJokes({ category: 'misc', unfiltered: true })).map((j) => j.id),
      [1, 2]
    );
  });

  it('retries once on a 5xx, then succeeds', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return calls === 1 ? new Response('boom', { status: 503 }) : batch([single(1)]);
    }) as typeof fetch;
    assert.equal((await fetchJokes({ category: 'misc' })).length, 1);
    assert.equal(calls, 2);
  });

  it('retries a network error once, then gives up as ProviderError', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      throw new Error('socket hang up');
    }) as typeof fetch;
    await assert.rejects(fetchJokes({ category: 'misc' }), { name: 'ProviderError' });
    assert.equal(calls, 2);
  });

  it('never retries a 4xx or 429', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response('{}', { status: 429 });
    }) as typeof fetch;
    await assert.rejects(fetchJokes({ category: 'misc' }), { name: 'ProviderError' });
    assert.equal(calls, 1);
  });

  it('only provider code 106 is a range miss; other provider errors are typed failures', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: true, code: 106 }), { status: 400 })) as typeof fetch;
    await assert.rejects(fetchJokes({ category: 'misc' }), { name: 'JokeRangeEmptyError' });
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: true, code: 101 }), { status: 400 })) as typeof fetch;
    await assert.rejects(fetchJokes({ category: 'misc' }), { name: 'ProviderError' });
  });

  it('refuses an oversized body without retrying', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response('x'.repeat(300 * 1024));
    }) as typeof fetch;
    await assert.rejects(fetchJokes({ category: 'misc' }), { name: 'ProviderError' });
    assert.equal(calls, 1);
  });
});

describe('meme share validation', () => {
  const base = { chatId: '507f1f77bcf86cd799439011', gifId: 'x' } as const;
  const meme = (gifUrl: string) =>
    sendGifSchema.safeParse({ ...base, gifUrl, mimeType: 'image/jpeg', kind: 'meme' }).success;
  const gif = (gifUrl: string) => sendGifSchema.safeParse({ ...base, gifUrl }).success;

  it('allows api.memegen.link images for kind meme and klipy for kind gif, nothing crossed', () => {
    assert.equal(meme('https://api.memegen.link/images/buzz/top/_bottom.jpg?width=600'), true);
    assert.equal(meme('https://i.redd.it/x.jpg'), false);
    assert.equal(gif('https://media.klipy.com/x.gif'), true);
    assert.equal(gif('https://klipy.com/x.gif'), true);
    assert.equal(gif('https://api.memegen.link/images/buzz/a/b.jpg'), false);
  });

  it('rejects suffix spoofs, http, odd ports and credentials', () => {
    assert.equal(meme('https://evilmemegen.link/images/a/b.jpg'), false);
    assert.equal(meme('https://memegen.link.evil.com/images/a/b.jpg'), false);
    assert.equal(meme('https://api.memegen.link.evil.com/images/a/b.jpg'), false);
    assert.equal(meme('http://api.memegen.link/images/a/b.jpg'), false);
    assert.equal(meme('https://api.memegen.link:8443/images/a/b.jpg'), false);
    assert.equal(meme('https://user:pw@api.memegen.link/images/a/b.jpg'), false);
    assert.equal(meme('https://api.memegen.link/other/a.jpg'), false);
    assert.equal(gif('https://evilklipy.com/x.gif'), false);
    assert.equal(gif('https://klipy.com.evil.com/x.gif'), false);
    assert.equal(gif('http://media.klipy.com/x.gif'), false);
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
