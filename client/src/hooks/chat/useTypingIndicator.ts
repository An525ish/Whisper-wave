import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@/constants/socket';
import { useAuthStore } from '@/stores/auth';

interface Params {
  chatId: string | undefined;
  socket: Socket;
}

export function useTypingIndicator({ chatId, socket }: Params) {
  const isImpersonated = useAuthStore((s) => s.isImpersonated);
  const [isTyping, setIsTyping] = useState(false);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prevChatId, setPrevChatId] = useState(chatId);

  if (chatId !== prevChatId) {
    setPrevChatId(chatId);
    setIsTyping(false);
  }

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  const emitStopTyping = useCallback(() => {
    const id = chatId;
    if (isImpersonated || !id) return;
    socket.emit(SOCKET_EVENTS.STOP_TYPING, { chatId: id });
  }, [chatId, isImpersonated, socket]);

  const emitStartTyping = useCallback(() => {
    const id = chatId;
    if (isImpersonated || !id) return;
    socket.emit(SOCKET_EVENTS.START_TYPING, { chatId: id });
  }, [chatId, isImpersonated, socket]);

  const clearTypingState = useCallback(
    (notifyPeers: boolean) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isTypingRef.current) {
        setIsTyping(false);
        if (notifyPeers) emitStopTyping();
      }
    },
    [emitStopTyping],
  );

  // Cleanup on unmount / chatId change: stop typing notification
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isTypingRef.current && !isImpersonated) {
        const id = chatId;
        if (id) {
          socket.emit(SOCKET_EVENTS.STOP_TYPING, { chatId: id });
        }
      }
    };
  }, [chatId, isImpersonated, socket]);

  return {
    isTyping,
    setIsTyping,
    isTypingRef,
    timeoutRef,
    clearTypingState,
    emitStartTyping,
    emitStopTyping,
  };
}
