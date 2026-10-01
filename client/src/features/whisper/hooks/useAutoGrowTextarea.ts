import { useEffect, useRef } from 'react';

const MIN_HEIGHT = 44;
const MAX_HEIGHT = 128;

/**
 * Grow a textarea to fit its content, up to a cap.
 * Extracted so `AnonChatRoom` stays a description of the UI.
 */
export function useAutoGrowTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(MIN_HEIGHT, Math.min(el.scrollHeight, MAX_HEIGHT))}px`;
  }, [value]);

  return ref;
}
