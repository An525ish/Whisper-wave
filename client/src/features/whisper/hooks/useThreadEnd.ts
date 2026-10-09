import { useAnonStore } from '../stores/anonStore';
import { deriveThreadSummary } from '../utils/threadSummary';

/**
 * The end-of-thread card contents. Frozen at the moment the partner left
 * (`endedAt`), so the duration doesn't keep growing while the card is on screen.
 * Null while the thread is live.
 */
export function useThreadEnd(startedAt: number | null) {
  const messages = useAnonStore((s) => s.messages);
  const vibeTags = useAnonStore((s) => s.vibeTags);
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const status = useAnonStore((s) => s.status);
  const endedAt = useAnonStore((s) => s.endedAt);

  return {
    summary:
      status === 'partner_left' && startedAt && endedAt
        ? deriveThreadSummary(messages, vibeTags, partnerTags, startedAt, endedAt)
        : null,
  };
}
