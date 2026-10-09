import type { AnonMessage, ReactionTally } from '../types';

/**
 * How many times each side used each curated reaction, busiest first.
 *
 * `reactions.me` / `reactions.them` are the reaction *given by* that side (the
 * server already speaks relative to this client), whichever message it landed on.
 * Reactions nobody used are omitted so the panel shows only what happened.
 */
export const reactionTally = (messages: AnonMessage[]): ReactionTally[] => {
  const counts = new Map<ReactionTally['reaction'], ReactionTally>();

  const bump = (reaction: ReactionTally['reaction'], side: 'me' | 'them') => {
    const row = counts.get(reaction) ?? { reaction, me: 0, them: 0 };
    row[side] += 1;
    counts.set(reaction, row);
  };

  for (const message of messages) {
    if (message.reactions?.me) bump(message.reactions.me, 'me');
    if (message.reactions?.them) bump(message.reactions.them, 'them');
  }

  return [...counts.values()].sort((a, b) => b.me + b.them - (a.me + a.them));
};
