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
  { sender: 'b', text: '✦ it\'s a vibe — connect?', delayMs: 9600, isMutual: true },
];

const TYPING_DURATION_MS = 900;
const LOOP_PAUSE_MS = 4000;

export const useAnimatedChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const stepRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleNext = () => {
      const index = stepRef.current;

      if (index >= SCRIPT.length) {
        timerRef.current = setTimeout(() => {
          setMessages([]);
          stepRef.current = 0;
          scheduleNext();
        }, LOOP_PAUSE_MS);
        return;
      }

      const entry = SCRIPT[index];

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
            prev.map((m) =>
              m.id === index ? { ...m, state: 'visible' } : m,
            ),
          );
          stepRef.current = index + 1;
          scheduleNext();
        }, TYPING_DURATION_MS);
      }, index === 0 ? 600 : entry.delayMs - SCRIPT[index - 1].delayMs - TYPING_DURATION_MS);
    };

    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { messages };
};
