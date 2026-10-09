import { track } from '@/shared/lib/analytics';
import { WHISPER_EVENTS } from '../constants';
import { useAnonStore } from './anonStore';

/**
 * Emit SESSION_END for the current match — at most once per session, whichever
 * end path gets there first (skip, leave, partner left, expiry, DM opened).
 *
 * Counts only messages that actually landed (theirs + our acked ones), so the
 * number matches what the vibe gate and the server see.
 */
export const trackSessionEnd = (reason: string): void => {
  const { sessionId, matchedAt, messages, sessionEndTracked, markSessionEndTracked } =
    useAnonStore.getState();
  if (!sessionId || !matchedAt || sessionEndTracked) return;
  markSessionEndTracked();
  track(WHISPER_EVENTS.SESSION_END, {
    durationMs: Date.now() - matchedAt,
    messageCount: messages.filter((m) => m.from === 'them' || m.delivery === 'sent').length,
    reason,
  });
};
