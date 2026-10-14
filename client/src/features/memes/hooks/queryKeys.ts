import type { MemeCategory } from '../types';

/** Query keys owned by the memes domain. */
export const memeKeys = {
  /** The mode rides the key: flipping it swaps streams, never mixes them. */
  feed: (category: MemeCategory, unfiltered: boolean) =>
    ['memes', 'feed', category, unfiltered ? 'raw' : 'safe'] as const,
  saves: ['memes', 'saves'] as const,
  mode: ['memes', 'mode'] as const,
};
