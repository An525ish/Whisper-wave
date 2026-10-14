import { describe, it, afterEach, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { MemeBlock } from '../../../models/memeBlock.js';
import { blockJokeId } from '../blocklist.js';
import { getMemeFeed } from '../feed.js';

const realFetch = globalThis.fetch;

const jsonRes = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status });

/** Ten distinct single jokes — a full random page in one attempt. */
const tenJokes = (fromId: number, prefix: string) => ({
  error: false,
  amount: 10,
  jokes: Array.from({ length: 10 }, (_, i) => ({
    id: fromId + i,
    category: 'Misc',
    type: 'single',
    joke: `${prefix} ${i + 1}`,
  })),
});

/**
 * Feed cache/pool/blocklist state is module-level, so each test runs at a
 * fresh mocked "now", ten minutes past the last — every TTL has lapsed and
 * entries from earlier tests are only ever stale fallbacks. The blocklist's
 * Mongo reads/writes are stubbed onto an in-memory list.
 */
let clock = 1_700_000_000_000;
const dbBlocked: number[] = [];

beforeEach(() => {
  clock += 10 * 60 * 1000;
  mock.timers.enable({ apis: ['Date'], now: clock });
  mock.method(MemeBlock, 'find', () => ({
    limit: () => ({ lean: async () => dbBlocked.map((externalId) => ({ externalId })) }),
  }));
  mock.method(MemeBlock, 'updateOne', async (filter: { externalId: number }) => {
    dbBlocked.push(filter.externalId);
    return {};
  });
});

afterEach(() => {
  globalThis.fetch = realFetch;
  mock.timers.reset();
  mock.restoreAll();
});

describe('meme feed empty-range fallback', () => {
  it('pours random jokes when a category id window comes back empty', async () => {
    let calls = 0;
    globalThis.fetch = (async (url: string | URL | Request) => {
      calls += 1;
      const href = String(url);
      if (href.includes('idRange')) {
        return jsonRes({ error: false, amount: 0, jokes: [] });
      }
      return jsonRes(tenJokes(424241, 'Fallback laugh'));
    }) as typeof fetch;

    const page = await getMemeFeed({ category: 'misc', page: 3 });
    assert.equal(page.page, 3);
    assert.equal(page.items.length, 10);
    // The random page is shuffled on purpose (no fixed order) — assert the set, not the order.
    assert.deepEqual(
      page.items.map((i) => i.setup).sort(),
      Array.from({ length: 10 }, (_, n) => `Fallback laugh ${n + 1}`).sort()
    );
    assert.equal(calls, 2);
  });

  it('treats the provider 106 no-match answer as a range miss, not an outage', async () => {
    let calls = 0;
    globalThis.fetch = (async (url: string | URL | Request) => {
      calls += 1;
      const href = String(url);
      if (href.includes('idRange')) {
        // Live shape past a category's max id (Misc tops out near 318):
        // HTTP 400 *with* a 106 body.
        return jsonRes(
          {
            error: true,
            internalError: false,
            code: 106,
            message: 'No matching joke found',
          },
          400
        );
      }
      return jsonRes(tenJokes(424244, 'Random rescue'));
    }) as typeof fetch;

    const page = await getMemeFeed({ category: 'misc', page: 7 });
    assert.equal(page.page, 7);
    assert.equal(page.items.length, 10);
    assert.deepEqual(
      page.items.map((i) => i.setup).sort(),
      Array.from({ length: 10 }, (_, n) => `Random rescue ${n + 1}`).sort()
    );
    assert.equal(calls, 2);
  });

  it('does not refetch when the ranged page already has jokes', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonRes({
        error: false,
        amount: 2,
        jokes: [
          { id: 424242, category: 'Pun', type: 'single', joke: 'One' },
          { id: 424243, category: 'Pun', type: 'single', joke: 'Two' },
        ],
      });
    }) as typeof fetch;

    const page = await getMemeFeed({ category: 'pun', page: 5 });
    assert.equal(page.items.length, 2);
    assert.equal(calls, 1);
  });

  it('pours around already-seen jokes on the random path', async () => {
    let calls = 0;
    globalThis.fetch = (async (url: string | URL | Request) => {
      calls += 1;
      const href = String(url);
      if (href.includes('idRange')) {
        return jsonRes({ error: true, code: 106, message: 'No matching joke found' }, 400);
      }
      return jsonRes({
        error: false,
        amount: 3,
        jokes: [
          { id: 424250, category: 'Misc', type: 'single', joke: 'Seen one' },
          { id: 424251, category: 'Misc', type: 'single', joke: 'Seen two' },
          { id: 424252, category: 'Misc', type: 'single', joke: 'Fresh' },
        ],
      });
    }) as typeof fetch;

    const page = await getMemeFeed({ category: 'misc', page: 11, exclude: '424250,424251' });
    assert.equal(page.items.length, 1);
    assert.equal(page.items[0]?.setup, 'Fresh');
    assert.equal(calls, 3); // ranged miss + a refill that adds 3 + a refill that adds nothing new → dry
  });

  it('keeps ranged pages positional — exclude never narrows them', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonRes({
        error: false,
        amount: 2,
        jokes: [
          { id: 424260, category: 'Pun', type: 'single', joke: 'One' },
          { id: 424261, category: 'Pun', type: 'single', joke: 'Two' },
        ],
      });
    }) as typeof fetch;

    const page = await getMemeFeed({ category: 'pun', page: 8, exclude: '424260,424261' });
    assert.equal(page.items.length, 2);
    assert.equal(calls, 1);
  });

  it('admits true exhaustion with an empty page after top-up attempts', async () => {
    let calls = 0;
    globalThis.fetch = (async (url: string | URL | Request) => {
      calls += 1;
      const href = String(url);
      if (href.includes('idRange')) {
        return jsonRes({ error: true, code: 106, message: 'No matching joke found' }, 400);
      }
      return jsonRes({
        error: false,
        amount: 2,
        jokes: [
          { id: 424270, category: 'Misc', type: 'single', joke: 'Seen one' },
          { id: 424271, category: 'Misc', type: 'single', joke: 'Seen two' },
        ],
      });
    }) as typeof fetch;

    const page = await getMemeFeed({ category: 'misc', page: 12, exclude: '424270,424271' });
    assert.equal(page.items.length, 0);
    assert.equal(calls, 3); // ranged miss + refill (2 new, both seen) + refill (nothing new) → dry
  });

  it('rotates the safe shelves per page for the mix selector — never Dark', async () => {
    const requested: string[] = [];
    globalThis.fetch = (async (url: string | URL | Request) => {
      const href = String(url);
      requested.push(href);
      const segment = href.split('/joke/')[1]?.split('?')[0] ?? 'Misc';
      const id = 424280 + requested.length;
      return jsonRes({
        error: false,
        amount: 1,
        jokes: [{ id, category: segment, type: 'single', joke: 'Mixed' }],
      });
    }) as typeof fetch;

    for (let page = 0; page < 6; page++) await getMemeFeed({ category: 'mix', page });
    const shelves = requested.map((href) => href.split('/joke/')[1]?.split('?')[0]);
    assert.deepEqual(shelves, ['Misc', 'Programming', 'Pun', 'Misc', 'Programming', 'Pun']);
  });

  it('adds Dark to the mix rotation only for the unfiltered opt-in', async () => {
    const requested: string[] = [];
    globalThis.fetch = (async (url: string | URL | Request) => {
      requested.push(String(url));
      return jsonRes({
        error: false,
        amount: 1,
        jokes: [{ id: 5000 + requested.length, category: 'Dark', type: 'single', joke: 'Raw' }],
      });
    }) as typeof fetch;
    await getMemeFeed({ category: 'mix', page: 3, unfiltered: true });
    assert.ok(requested[0]?.includes('/Dark?'), requested[0]);
    assert.ok(!requested[0]?.includes('blacklistFlags'), requested[0]);
  });

  it('refuses the Dark shelf without the unfiltered opt-in (403, no provider call)', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonRes(tenJokes(1, 'x'));
    }) as typeof fetch;
    await assert.rejects(getMemeFeed({ category: 'dark', page: 0 }), { statusCode: 403 });
    assert.equal(calls, 0);
  });

  it('keeps the blacklist on filtered pages and drops it when opted in', async () => {
    const requested: string[] = [];
    globalThis.fetch = (async (url: string | URL | Request) => {
      requested.push(String(url));
      return jsonRes(tenJokes(424290, 'Mode check'));
    }) as typeof fetch;

    // Page 14 is past every ranged depth: straight to the random path.
    await getMemeFeed({ category: 'pun', page: 14 });
    await getMemeFeed({ category: 'pun', page: 14, unfiltered: true });
    assert.ok(requested[0]?.includes('blacklistFlags='), requested[0]);
    assert.ok(!requested[1]?.includes('blacklistFlags'), requested[1]);
    assert.ok(!requested[1]?.includes('safe-mode'), requested[1]);
  });
});

describe('meme feed hardening', () => {
  it('serves stale cache on provider failure but still applies the blocklist', async () => {
    const batch = {
      error: false,
      amount: 2,
      jokes: [
        { id: 7001, category: 'Pun', type: 'single', joke: 'Keep' },
        { id: 7002, category: 'Pun', type: 'single', joke: 'Hide later' },
      ],
    };
    globalThis.fetch = (async () => jsonRes(batch)) as typeof fetch;
    const first = await getMemeFeed({ category: 'pun', page: 2 });
    assert.equal(first.items.length, 2);

    await blockJokeId(7002);
    mock.timers.tick(50_000); // past the 45 s cache TTL
    globalThis.fetch = (async () => jsonRes({}, 429)) as typeof fetch;
    const stale = await getMemeFeed({ category: 'pun', page: 2 });
    assert.equal(stale.stale, true);
    assert.deepEqual(stale.items.map((j) => j.id), [7001]);
  });

  it('does not pour random on a non-106 provider error', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonRes({ error: true, code: 100, message: 'Bad request' }, 400);
    }) as typeof fetch;
    await assert.rejects(getMemeFeed({ category: 'misc', page: 9 }), { name: 'ProviderError' });
    assert.equal(calls, 1);
  });

  it('single-flights concurrent identical misses into one upstream call', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return jsonRes({
        error: false,
        amount: 1,
        jokes: [{ id: 7100, category: 'Misc', type: 'single', joke: 'Once' }],
      });
    }) as typeof fetch;
    const pages = await Promise.all(
      Array.from({ length: 5 }, () => getMemeFeed({ category: 'misc', page: 4 }))
    );
    assert.equal(calls, 1);
    assert.ok(pages.every((p) => p.items.length === 1));
  });

  it('shares one random pool between callers instead of one upstream call each', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonRes(tenJokes(7200, 'Pool'));
    }) as typeof fetch;
    const [a, b] = [
      await getMemeFeed({ category: 'misc', page: 14 }),
      await getMemeFeed({ category: 'misc', page: 14 }),
    ];
    assert.equal(a.items.length, 10);
    assert.equal(b.items.length, 10);
    assert.equal(calls, 1);
  });

  it('clamps an oversized page to the first random-only page', async () => {
    globalThis.fetch = (async () => jsonRes(tenJokes(7300, 'Clamp'))) as typeof fetch;
    const page = await getMemeFeed({ category: 'pun', page: 500 });
    assert.equal(page.page, 14);
  });
});
