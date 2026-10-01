import { useEffect } from 'react';
import { useAnonStore } from '../stores/anonStore';

/**
 * How long the user has to decide before we put them back in the queue.
 *
 * Long enough to read the prompt and hit Stop, short enough that the common case
 * — someone who simply wants another person — doesn't have to click through a
 * dead end.
 */
export const PARTNER_LEFT_AUTO_REQUEUE_MS = 4000;

/**
 * Drives the partner-left state: requeue automatically, unless the user stops it.
 *
 * The visible countdown is a CSS animation on the button rather than a per-tick
 * number, which keeps this to one timer and no per-interval state. The
 * requeue itself uses a single `setTimeout`, so a throttled background tab still
 * fires at the right wall-clock moment instead of silently pausing the way a
 * decrementing counter would.
 *
 * Requeuing is never silent. A dead composer with no explanation reads as a
 * broken app, which is why the button animates and names the action.
 */
export function usePartnerLeftPrompt(onFindSomeoneNew: () => void) {
  const status = useAnonStore((s) => s.status);
  const dismissed = useAnonStore((s) => s.partnerLeftPromptDismissed);

  const active = status === 'partner_left' && !dismissed;

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(onFindSomeoneNew, PARTNER_LEFT_AUTO_REQUEUE_MS);
    return () => window.clearTimeout(id);
  }, [active, onFindSomeoneNew]);

  return { showPrompt: active };
}