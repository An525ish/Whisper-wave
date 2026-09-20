import { useEffect, useRef, useState } from 'react';
import type { MatchArcPhase } from '@/types/landing';

const SEARCHING_MS = 3500;
const MATCHED_MS = 900;

const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Drives the hero Match Arc: searching → matched → chatting → spark → loop.
 * Chat playback owns the spark + loop-back timing via `onSpark` /
 * `onCycleComplete`; this hook only advances the pre-chat beats.
 */
export const useMatchArc = () => {
  const [phase, setPhase] = useState<MatchArcPhase>(() => {
    if (typeof window !== 'undefined' && window.matchMedia(REDUCE_MOTION_QUERY).matches) {
      return 'chatting';
    }
    return 'searching';
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia(REDUCE_MOTION_QUERY).matches;
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (reduceMotion.current) return;

    if (phase === 'searching') {
      timerRef.current = setTimeout(() => setPhase('matched'), SEARCHING_MS);
    } else if (phase === 'matched') {
      timerRef.current = setTimeout(() => setPhase('chatting'), MATCHED_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

  const onSpark = () => {
    setPhase((current) => (current === 'chatting' ? 'spark' : current));
  };

  const onCycleComplete = () => {
    if (reduceMotion.current) {
      setPhase('chatting');
      return;
    }
    setPhase('searching');
  };

  return {
    phase,
    chatActive: phase === 'chatting' || phase === 'spark',
    onSpark,
    onCycleComplete,
  };
};
