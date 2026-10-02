import { useEffect, useRef } from 'react';
import { useAnonStore } from '../stores/anonStore';
import { useNowWhile } from './useNowWhile';
import { deriveThreadSummary } from '../utils/threadSummary';
import { appendWhisperHistory } from '../utils/whisperHistory';

/**
 * What happens when a thread ends: the summary card, and the device-local archive.
 *
 * Split out of `AnonChatRoom` because the archive is a genuine side effect that
 * must fire exactly once, and none of that belongs in a component that renders
 * JSX.
 *
 * The archive is deliberately device-local: the product is built on ephemerality,
 * so we keep what the user would otherwise lose without the server ever learning
 * who they talked to. It stores aliases and shared vibe tags only — never message
 * content.
 */
export function useThreadEnd(partnerName: string, startedAt: number | null) {
  const messages = useAnonStore((s) => s.messages);
  const vibeTags = useAnonStore((s) => s.vibeTags);
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const status = useAnonStore((s) => s.status);

  // Only ticks once the thread is over; a live thread has no "ended" summary to
  // derive and an always-on interval would keep every anon chat re-rendering.
  const endedAtNow = useNowWhile(status === 'partner_left');

  /**
   * Archive the thread exactly once, when it ends.
   *
   * An effect, not a render-phase write — `localStorage` is an external system.
   * The ref guards against re-firing as the user types in the ended thread, and
   * `appendWhisperHistory` is idempotent on `endedAt`, so a StrictMode double
   * invoke cannot produce two entries either.
   */
  const archivedRef = useRef(false);
  useEffect(() => {
    if (archivedRef.current) return;
    if (status !== 'partner_left' || !startedAt) return;
    archivedRef.current = true;

    const endedAt = Date.now();
    appendWhisperHistory({
      myAlias: useAnonStore.getState().sessionAlias ?? '',
      partnerAlias: partnerName,
      sharedTags: deriveThreadSummary(
        messages,
        vibeTags,
        partnerTags,
        startedAt,
        endedAt
      ).sharedTags,
      durationMs: endedAt - startedAt,
      messageCount: messages.length,
      endedAt,
    });
  }, [status, startedAt, partnerName, messages, vibeTags, partnerTags]);

  return {
    /** End-of-thread card contents; null while the thread is still live. */
    summary:
      status === 'partner_left' && startedAt
        ? deriveThreadSummary(messages, vibeTags, partnerTags, startedAt, endedAtNow)
        : null,
  };
}
