/**
 * Joke item served by the memes feed — normalized from JokeAPI, rendered
 * through Memegen. The client never talks to either provider: no secret
 * today, but the proxy is also where caching, filtering and the blocklist
 * live, so the shape stays ours whatever the source becomes.
 */
export type MemeCategory = 'programming' | 'misc' | 'pun' | 'dark';

/** Feed-level pseudo-category: rotates the three safe shelves per page. */
export type MemeFeedSelector = MemeCategory | 'mix';

/** Provider-level categories only — never the `mix` selector. */
export type MemeProviderCategory = Exclude<MemeFeedSelector, 'mix'>;

export type JokeItem = {
  /** Provider joke id — the blocklist and dedupe key. */
  id: number;
  category: string;
  /** Full text for single jokes; setup line for two-parters. */
  setup: string;
  /** Delivery line for two-parters; absent for single jokes. */
  delivery?: string;
  /** Ready-to-render meme image (Memegen, third-party hosted). */
  imageUrl: string;
};

export type MemeFeedPage = {
  items: JokeItem[];
  /** Echoed page; the client increments for the next batch. */
  page: number;
  /** True when served from a stale cache because the provider failed. */
  stale?: boolean;
};
