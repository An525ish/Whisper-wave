import { useEffect, useRef, useState } from 'react';

/**
 * Drives a one-time, mount-triggered staged reveal: returns how many of
 * `steps` are currently shown, advancing by one every `interval` ms after an
 * initial `startDelay`. This powers the hero's single orchestrated moment —
 * the anonymous conversation typing itself in — without pulling in a full
 * animation library.
 *
 * Accessibility: under `prefers-reduced-motion` every step is revealed
 * immediately (no timers, no motion), so the content is all present at once.
 */
export const useStagedReveal = (
  steps: number,
  { interval = 900, startDelay = 300 }: { interval?: number; startDelay?: number } = {},
) => {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [shown, setShown] = useState(prefersReduced ? steps : 0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (prefersReduced) return;

    for (let i = 1; i <= steps; i += 1) {
      const id = window.setTimeout(() => setShown(i), startDelay + (i - 1) * interval);
      timers.current.push(id);
    }

    const captured = timers.current;
    return () => captured.forEach(window.clearTimeout);
  }, [steps, interval, startDelay, prefersReduced]);

  return { shown, done: shown >= steps, prefersReduced };
};
