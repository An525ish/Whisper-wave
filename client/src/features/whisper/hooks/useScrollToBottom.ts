import { useEffect, useRef } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

/**
 * Keep the message list pinned to the newest message.
 *
 * Honors `prefers-reduced-motion` — smooth scrolling is motion, and the CSS
 * media query in whisper.css cannot reach a JS `scrollIntoView` call.
 */
export function useScrollToBottom(dependency: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const calm = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
  }, [dependency, calm]);

  return ref;
}
