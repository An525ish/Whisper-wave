/**
 * Conversation starters for a fresh anonymous thread.
 *
 * These are load-bearing, not decoration. Two strangers with nothing to say
 * produce a dead chat in seconds, and the `VIBE_UNLOCK` gate (90s + 2 messages
 * each side + 5 total — see `isVibeUnlocked.ts`) is unreachable without them, so
 * weak copy here quietly costs the whole funnel.
 *
 * How the list is written:
 * - Every prompt is answerable in ONE line. A prompt that needs a paragraph
 *   back is a prompt that ends the thread.
 * - Roughly a third are cheap (opinion / show-me-something / one-word answers),
 *   because the first exchange has to be cheap or it doesn't happen.
 * - The rest buy depth once the thread is moving.
 * - No dating-app framing, no innuendo, no "describe yourself". Nothing here
 *   asks who someone *is*; the alias was chosen deliberately and the product
 *   bet is that it's enough.
 *
 * Pure module: no React, no clock, no randomness. The caller owns the seed, so
 * a given `(seen, seed)` pair always resolves to the same prompt.
 */

export type Icebreaker = {
  /**
   * Stable forever — it is both the React key and the "already seen" marker.
   * Renumbering or retyping an id makes a prompt the user has read look brand
   * new, so treat these like enum members.
   */
  id: string;
  text: string;
};

export const ICEBREAKERS: readonly Icebreaker[] = [
  {
    id: 'unpopular-opinion',
    text: 'What’s an opinion you’d say out loud but never type in the group chat?',
  },
  {
    id: 'tiny-win',
    text: 'What’s the smallest thing that made today better?',
  },
  {
    id: 'overrated',
    text: 'What’s something everyone loves that you couldn’t care less about?',
  },
  {
    id: 'useless-skill',
    text: 'You’ve got exactly one completely useless skill. What is it?',
  },
  {
    id: 'emoji-week',
    text: 'Quick one before the deep stuff: one emoji for your whole week. Go.',
  },
  {
    id: 'song-for-someone',
    text: 'Which song would you play for someone who needed cheering up?',
  },
  {
    id: 'advice-you-ignore',
    text: 'What advice do you give everyone and then ignore yourself?',
  },
  {
    id: 'five-years',
    text: 'What does your life look like in five years, honestly?',
  },
  {
    id: 'tabs-open',
    text: 'Real question: how many tabs are open on your phone right now?',
  },
  {
    id: 'instant-like',
    text: 'What’s a tiny thing that instantly makes you like someone?',
  },
  {
    id: 'no-talent',
    text: 'What would you love to be genuinely great at but have zero talent for?',
  },
  {
    id: 'last-laugh',
    text: 'What’s the last thing that made you laugh out loud when you were alone?',
  },
  {
    id: 'stranger-wallpaper',
    text: 'What would you put on a stranger’s phone wallpaper? No explaining.',
  },
  {
    id: 'delete-rule',
    text: 'What’s a rule everybody follows that you’d quietly delete?',
  },
];

/**
 * The next starter to show, or `null` only once every prompt has been seen.
 *
 * Deterministic by construction: the same `(seen, seed)` always yields the same
 * prompt, which is what lets a caller persist nothing at all and still get
 * stable, non-repeating prompts across renders.
 *
 * The modulo runs over the *unseen* set, so as the caller pushes ids into
 * `seen` the window slides and an incrementing seed walks every remaining
 * prompt in order before wrapping. Exhaustive in one step — no retry loop that
 * can spin, and no `undefined` while anything is left.
 */
export const pickIcebreaker = (
  seen: readonly string[],
  seed: number
): Icebreaker | null => {
  const seenIds = new Set(seen);
  const unseen = ICEBREAKERS.filter((prompt) => !seenIds.has(prompt.id));
  const total = unseen.length;
  if (total === 0) return null;

  // `seed` arrives from the outside, so tolerate NaN/Infinity/negatives rather
  // than producing `NaN % n` → `undefined`.
  const step = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  return unseen[Math.abs(step) % total];
};
