import { useEffect, useState } from 'react';

/**
 * A `Date.now()` that is legal to read during render, and the feature's single
 * interval-driven clock (thread stats, vibe gate, expiry and connect countdowns).
 *
 * React's compiler rejects `Date.now()` in a component body — it is impure. The
 * fix is to own the clock in state and let an interval drive it, which is also
 * what makes a countdown tick.
 *
 * Ticks only while `active`, so a finished thread doesn't keep re-rendering.
 */
export function useNowWhile(active: boolean, tickMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [active, tickMs]);

  return now;
}
