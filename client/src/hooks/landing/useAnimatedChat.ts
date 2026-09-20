import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, ChatScriptEntry } from '@/types/landing';

const SCRIPT: ChatScriptEntry[] = [
  { sender: 'a', text: 'hey', delayMs: 0 },
  { sender: 'b', text: 'hi stranger 👀', delayMs: 1400 },
  { sender: 'a', text: 'ok ur actually funny', delayMs: 2600 },
  { sender: 'b', text: 'you say that to all your matches', delayMs: 3800 },
  { sender: 'a', text: 'only the ones worth talking to', delayMs: 5200 },
  { sender: 'b', text: 'ok that was smooth', delayMs: 6600 },
  { sender: 'a', text: '👾 someone is vibing...', delayMs: 8000, isVibe: true },
  { sender: 'b', text: "✦ it's a vibe — connect?", delayMs: 9600, isMutual: true },
];

const TYPING_DURATION_MS = 900;
/** Hold on the mutual vibe beat so left-side copy is readable. */
const AFTER_SPARK_MS = 4500;

type Params = {
  /** When false, clears the stream and pauses scheduling. */
  active: boolean;
  onSpark?: () => void;
  onCycleComplete?: () => void;
};

/**
 * Scripted anon chat for the hero. Only runs while `active` is true
 * (Match Arc chatting/spark phases). Fires `onSpark` when mutual like
 * becomes visible, then `onCycleComplete` after a short hold so the
 * arc can loop back to searching.
 */
export const useAnimatedChat = ({ active, onSpark, onCycleComplete }: Params) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const stepRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sparkedRef = useRef(false);
  const onSparkRef = useRef(onSpark);
  const onCycleCompleteRef = useRef(onCycleComplete);

  onSparkRef.current = onSpark;
  onCycleCompleteRef.current = onCycleComplete;

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!active) {
      clearTimer();
      setMessages([]);
      stepRef.current = 0;
      sparkedRef.current = false;
      return;
    }

    const scheduleNext = () => {
      const index = stepRef.current;

      if (index >= SCRIPT.length) {
        timerRef.current = setTimeout(() => {
          // Reduced motion skips the searching arc — loop the chat in place.
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setMessages([]);
            stepRef.current = 0;
            sparkedRef.current = false;
            scheduleNext();
            return;
          }
          onCycleCompleteRef.current?.();
        }, AFTER_SPARK_MS);
        return;
      }

      const entry = SCRIPT[index];
      const waitMs =
        index === 0
          ? 500
          : Math.max(0, entry.delayMs - SCRIPT[index - 1].delayMs - TYPING_DURATION_MS);

      timerRef.current = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: index,
            sender: entry.sender,
            text: entry.text,
            state: 'typing',
            isVibe: entry.isVibe,
            isMutual: entry.isMutual,
          },
        ]);

        timerRef.current = setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === index ? { ...m, state: 'visible' } : m)),
          );

          if (entry.isMutual && !sparkedRef.current) {
            sparkedRef.current = true;
            onSparkRef.current?.();
          }

          stepRef.current = index + 1;
          scheduleNext();
        }, TYPING_DURATION_MS);
      }, waitMs);
    };

    scheduleNext();
    return clearTimer;
  }, [active]);

  return { messages };
};
