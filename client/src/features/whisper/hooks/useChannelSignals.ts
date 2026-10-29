import { useAnonStore } from '../stores/anonStore';
import { buildSparks } from '../utils/sparks';
import { vibeOverlap } from '../utils/vibeOverlap';

/**
 * What the conversation column itself needs to know about the pair: openers for
 * the empty thread and the composer, and the vibes you share (for the first-contact
 * line). Derived straight from the store, with no clock.
 */
export function useChannelSignals() {
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const sessionTags = useAnonStore((s) => s.sessionTags);

  const overlap = vibeOverlap(sessionTags ?? [], partnerTags);

  return {
    sparks: buildSparks(overlap),
    sharedTags: overlap.shared,
  };
}
