import { useAnonStore } from '../stores/anonStore';
import { extractThreadLinks } from '../utils/threadLinks';
import { reactionTally } from '../utils/reactionTally';
import { buildSparks } from '../utils/sparks';
import { vibeOverlap } from '../utils/vibeOverlap';
import { useThreadStats } from './useThreadStats';

/**
 * Everything the "them" panel shows, derived from what is already in the store.
 *
 * Nothing here is fetched: the partner's alias and tags arrive with `MATCH_FOUND`,
 * and the rest (overlap, sparks, links, reactions, balance) is computed
 * from the thread. Your side uses `sessionTags` — the tags this match began with —
 * not the live identity, because the partner only ever saw the former and a
 * mid-thread edit must not rewrite the overlap.
 */
export function usePartnerProfile() {
  const partnerName = useAnonStore((s) => s.partnerName);
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const sessionTags = useAnonStore((s) => s.sessionTags);
  const sessionAlias = useAnonStore((s) => s.sessionAlias);
  const displayName = useAnonStore((s) => s.displayName);
  const matchedAt = useAnonStore((s) => s.matchedAt);
  const messages = useAnonStore((s) => s.messages);
  const status = useAnonStore((s) => s.status);

  const myTags = sessionTags ?? [];
  const live = status === 'matched' || status === 'partner_left';
  const stats = useThreadStats(myTags, live);
  const overlap = vibeOverlap(myTags, partnerTags);

  return {
    name: partnerName ?? 'Stranger',
    myName: sessionAlias || displayName || 'You',
    /** Your vibes as this match began — what the partner actually saw. */
    myTags,
    matchedAt,
    tags: partnerTags,
    stats,
    overlap,
    sparks: buildSparks(overlap),
    links: extractThreadLinks(messages),
    reactions: reactionTally(messages),
  };
}
