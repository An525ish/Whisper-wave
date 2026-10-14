/**
 * Joke item served by the memes feed — normalized from JokeAPI, rendered
 * through Memegen. The client never talks to either provider: no secret
 * today, but the proxy is also where caching, filtering and the blocklist
 * live, so the shape stays ours whatever the source becomes.
 */
export type MemeCategory = 'programming' | 'misc' | 'pun' | 'dark';

/**
 * Feed-level pseudo-category. `mix` rotates programming/misc/pun per page;
 * `dark` joins the rotation (and is selectable) only for members with the
 * stored unfiltered opt-in.
 */
export type MemeFeedSelector = MemeCategory | 'mix';

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
