import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getMemeFeed } from '../feed.js';

const realFetch = globalThis.fetch;

const jsonRes = (payload: unknown, status = 200) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => payload,
  }) as Response;

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

afterEach(() => {
  globalThis.fetch = realFetch;
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
    assert.equal(page.items[0]?.setup, 'Fallback laugh 1');
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
    assert.equal(page.items[0]?.setup, 'Random rescue 1');
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
    assert.equal(calls, 5); // 1 ranged miss + 4 random top-up attempts around the seen set
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
    assert.equal(calls, 5); // 1 ranged miss + 4 random top-up attempts
  });

  it('rotates shelves per page for the mix selector', async () => {    const requested: string[] = [];
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

    // Rotation order is misc, programming, pun, dark.
    await getMemeFeed({ category: 'mix', page: 0 });
    await getMemeFeed({ category: 'mix', page: 1 });
    await getMemeFeed({ category: 'mix', page: 2 });
    await getMemeFeed({ category: 'mix', page: 3 });
    assert.ok(requested[0]?.includes('/Misc?'), requested[0]);
    assert.ok(requested[1]?.includes('/Programming?'), requested[1]);
    assert.ok(requested[2]?.includes('/Pun?'), requested[2]);
    assert.ok(requested[3]?.includes('/Dark?'), requested[3]);
  });

  it('keeps the blacklist on filtered pages and drops it when opted in', async () => {
    const requested: string[] = [];
    globalThis.fetch = (async (url: string | URL | Request) => {
      requested.push(String(url));
      return jsonRes(tenJokes(424290, 'Mode check'));
    }) as typeof fetch;

    // Page 21 is past every ranged depth: straight to the random path.
    await getMemeFeed({ category: 'pun', page: 21 });
    await getMemeFeed({ category: 'pun', page: 21, unfiltered: true });
    assert.ok(requested[0]?.includes('blacklistFlags='), requested[0]);
    assert.ok(!requested[1]?.includes('blacklistFlags'), requested[1]);
    assert.ok(!requested[1]?.includes('safe-mode'), requested[1]);
  });
});
