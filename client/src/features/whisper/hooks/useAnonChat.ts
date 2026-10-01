import { useState, useRef, useCallback } from 'react';
import { TYPING_IDLE_MS } from '../constants';
import { useAnonStore } from '../stores/anonStore';

/**
 * Manages the message input and own-side typing events.
 * Partner typing state is managed by the page (from the socket hook).
 *
 * `emitStart` / `emitStop` are socket emit callbacks injected from useAnonSocket.
 */
export function useAnonChat(emitStart: () => void, emitStop: () => void) {
  const [draft, setDraft] = useState('');
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const messages = useAnonStore((s) => s.messages);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitStop();
    }
  }, [emitStop]);

  const handleDraftChange = useCallback(
    (value: string) => {
      setDraft(value);

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        emitStart();
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        typingTimerRef.current = null;
        emitStop();
      }, TYPING_IDLE_MS);
    },
    [emitStart, emitStop]
  );

  const clearDraft = useCallback(() => {
    setDraft('');
    stopTyping();
  }, [stopTyping]);

  return { draft, messages, handleDraftChange, clearDraft };
}
