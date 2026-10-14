import type { HeroCopyBlock, HeroLeftBeat, MatchArcPhase } from './types';

export const LEFT_BEATS: HeroLeftBeat[] = ['searching', 'chatting', 'spark'];

export const STEP_INDEX: Record<HeroLeftBeat, number> = {
  searching: 0,
  chatting: 1,
  spark: 2,
};

export const toLeftBeat = (phase: MatchArcPhase): HeroLeftBeat => {
  if (phase === 'spark') return 'spark';
  if (phase === 'chatting') return 'chatting';
  return 'searching';
};

/**
 * Two-line titles + three-line subs, length-matched across beats
 * so the column fills the same way in every state.
 */
export const COPY: Record<HeroLeftBeat, HeroCopyBlock> = {
  searching: {
    kicker: 'no names here',
    line1: 'Meet a stranger.',
    line2: 'No profile to polish.',
    accent: 'polish.',
    body: [
      'No bio, no feed, no performing.',
      'Pick a name, drop in, and',
      'talk to whoever’s there.',
    ],
    cta: 'Find a stranger',
  },
  chatting: {
    kicker: 'a live line',
    line1: 'Say the real thing.',
    line2: 'Leave if it’s not it.',
    accent: 'not it.',
    body: [
      'No history, no receipts, no pressure.',
      'Stay while it feels good,',
      'let go when it doesn’t.',
    ],
    cta: 'Find a stranger',
  },
  spark: {
    kicker: 'a mutual spark',
    line1: 'Turns out, it’s mutual.',
    line2: 'Stay if you want.',
    accent: 'Stay',
    body: [
      'The stranger just became someone.',
      'Keep the conversation if it clicks,',
      'or let it fade — no trace.',
    ],
    cta: 'Keep this vibe',
  },
};
