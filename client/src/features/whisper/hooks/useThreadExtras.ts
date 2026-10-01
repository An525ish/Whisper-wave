import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNowWhile } from './useNowWhile';
import { useAnonStore } from '../stores/anonStore';
import { pickIcebreaker, type Icebreaker } from '../utils/icebreakers';
import { deriveThreadSummary } from '../utils/threadSummary';
import { appendWhisperHistory } from '../utils/whisperHistory';

/** How many starters are visible at once. */
const SHOWN = 2;

/**
 * Owns the two conversation aids and the moment a thread is archived.
 *
 * Extracted rather than inlined in `AnonChatRoom` because it is genuinely stateful
 * (which starters have been seen, a shuffle seed, and a one-shot fire on thread
 * end) and none of that belongs in a component that renders JSX.
 *
 * The archive is deliberately device-local: the product is built on ephemerality,
 * so we keep what the user would otherwise lose without the server ever learning
 * who they talked to.
 */
export function useThreadExtras(partnerName: string, startedAt: number | null) {
  const messages = useAnonStore((s) => s.messages);
  const vibeTags = useAnonStore((s) => s.vibeTags);
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const status = useAnonStore((s) => s.status);

  const [seen, setSeen] = useState<string[]>([]);
  const [seed, setSeed] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const endedAtNow = useNowWhile(status === 'partner_left');

  const prompts = useMemo<Icebreaker[]>(() => {
    const out: Icebreaker[] = [];
    for (let i = 0; i < SHOWN; i += 1) {
      const next = pickIcebreaker(seen, seed + i * 7);
      if (next && !out.some((p) => p.id === next.id)) out.push(next);
    }
    return out;
  }, [seen, seed]);

  const shuffle = useCallback(() => {
    setSeen((prev) => {
      const added = prompts.map((p) => p.id);
      return [...prev, ...added];
    });
    setSeed((s) => s + 1);
  }, [prompts]);

  const dismissedOnce = useCallback(() => setDismissed(true), []);

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
    showIcebreakers: status === 'matched' && !dismissed && messages.length < 4,
    prompts,
    onShuffle: shuffle,
    onDismissIcebreakers: dismissedOnce,
    /** End-of-thread card contents; null while the thread is still live. */
    summary:
      status === 'partner_left' && startedAt
        ? deriveThreadSummary(messages, vibeTags, partnerTags, startedAt, endedAtNow)
        : null,
  };
}