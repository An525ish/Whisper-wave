import { useEffect, useState } from 'react';

/**
 * A `Date.now()` that is legal to read during render.
 *
 * React's compiler rejects `Date.now()` in a component body — it is impure, so
 * the value would change on any unrelated re-render and the tree would stop being
 * idempotent. The fix is to own the clock in state and let an interval drive it,
 * which is also what makes a countdown tick.
 *
 * Ticks only while `active`. A live thread needs a per-minute countdown; a
 * finished one does not, and an always-on interval would keep every anon chat
 * re-rendering forever.
 */
export function useNowWhile(active: boolean, tickMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [active, tickMs]);

  return now;
}