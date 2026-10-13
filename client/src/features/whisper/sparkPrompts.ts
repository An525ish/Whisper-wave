/**
 * Conversation openers, keyed by the preset vibe tags (`VIBE_PRESETS` in
 * `constants.ts`). Content, not logic — `utils/sparks.ts` decides which to show.
 *
 * Written to be answerable in one line by a stranger: no "what's your biggest
 * trauma", nothing that asks for identifying detail.
 */
export const SPARK_BY_TAG: Record<string, { emoji: string; prompts: readonly string[] }> = {
  cozy: {
    emoji: '🕯️',
    prompts: ['Describe your perfect cozy night in.', 'Tea, coffee or hot chocolate — and why?'],
  },
  deep_talks: {
    emoji: '🌙',
    prompts: [
      'What’s something you’ve been thinking about lately?',
      'What’s a belief you’ve changed your mind on?',
    ],
  },
  gaming: {
    emoji: '🎮',
    prompts: ['What are you playing right now?', 'A game you’d love to play for the first time again?'],
  },
  chaotic: {
    emoji: '⚡',
    prompts: ['Most chaotic thing you’ve done this month?', 'What’s your most unhinged hot take?'],
  },
  music: {
    emoji: '🎧',
    prompts: ['What’s on repeat for you lately?', 'A song that always changes your mood?'],
  },
  overthinker: {
    emoji: '🌀',
    prompts: ['What did you overthink most recently?', 'Do you rehearse conversations in your head too?'],
  },
  night_owl: {
    emoji: '🦉',
    prompts: ['What keeps you up at night?', 'Best thing you’ve ever done at 3am?'],
  },
  creative: {
    emoji: '🎨',
    prompts: ['What are you making, or want to make?', 'Where do your best ideas show up?'],
  },
  foodie: {
    emoji: '🍜',
    prompts: ['Best meal you’ve ever had?', 'What’s your comfort food?'],
  },
  fitness: {
    emoji: '💪',
    prompts: ['What’s your go-to way to move?', 'Morning workout, or never?'],
  },
  travel: {
    emoji: '✈️',
    prompts: ['Best place you’ve ever been?', 'Where would you go tomorrow if you could?'],
  },
};

/** For vibes the user typed themselves, which have no curated prompts. */
export const CUSTOM_SPARK_EMOJI = '💬';

/** Tag-free openers: they pad the pool so there are always some to offer. */
export const GENERIC_SPARKS: readonly { emoji: string; text: string }[] = [
  { emoji: '✨', text: 'Two truths and a lie — you go first.' },
  { emoji: '🌍', text: 'If you could live anywhere for a year, where?' },
  { emoji: '😂', text: 'What’s the last thing that made you laugh out loud?' },
  { emoji: '☀️', text: 'What’s something small that made your day better?' },
];
