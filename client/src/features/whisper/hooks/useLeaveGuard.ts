import { useEffect, useState } from 'react';
import type { LeaveConfirmKind } from '../types';

/** Marker on the sentinel history entry, so we never stack more than one. */
const GUARD_KEY = 'whisperGuard';

/** A copy of the current router history state with our marker added. */
const guardedState = (): Record<string, unknown> => {
  const current: unknown = window.history.state;
  const base = typeof current === 'object' && current !== null ? current : {};
  return { ...base, [GUARD_KEY]: true };
};

const hasGuard = (): boolean => {
  const current: unknown = window.history.state;
  return typeof current === 'object' && current !== null && GUARD_KEY in current;
};

/**
 * Keeps browser Back from silently destroying a live match.
 *
 * While `live`, one sentinel history entry sits on top of /whisper. Back pops it
 * (the URL does not change), and we re-push it and ask for confirmation instead
 * of leaving. With no live match nothing is pushed and Back behaves normally.
 *
 * Known wart: after the match ends the sentinel stays in history, so a later Back
 * lands on /whisper once more before leaving. Popping it ourselves would risk
 * walking back out of a DM we just navigated into.
 *
 * `pending` is also driven by the chevron (`ask`), so both share one confirm.
 */
export function useLeaveGuard(live: boolean) {
  const [asked, setAsked] = useState<LeaveConfirmKind | null>(null);

  useEffect(() => {
    if (!live) return;
    if (!hasGuard()) window.history.pushState(guardedState(), '');

    const onPop = () => {
      window.history.pushState(guardedState(), '');
      setAsked('leave');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [live]);

  return {
    pending: live ? asked : null,
    ask: setAsked,
    clear: () => setAsked(null),
  };
}
